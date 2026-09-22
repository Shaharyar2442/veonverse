using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using VeonVerse.Api.Configuration;
using VeonVerse.Api.Dtos;

namespace VeonVerse.Api.Services;

/// <summary>
/// Calls the Groq chat-completions API and insists on strict JSON back.
/// Python equivalent: <c>BedrockService.converse_structured()</c> in
/// <c>backend/app/services/bedrock.py</c>.
/// </summary>
/// <remarks>
/// <para>The class keeps the Python name's spirit ("converse") but drops the misleading
/// "Bedrock" label — the Python file is called <c>bedrock.py</c> for historical reasons yet
/// talks to Groq, not AWS Bedrock. Nothing here touches AWS.</para>
///
/// <para><b>How structure is enforced,</b> in three layers, because language models will
/// happily return prose when you ask for JSON:</para>
/// <list type="number">
///   <item><description><c>response_format: json_object</c> tells Groq to constrain decoding to valid JSON.</description></item>
///   <item><description>The schema is restated in the prompt text, which measurably improves key adherence.</description></item>
///   <item><description>The four required keys are verified after parsing; a miss throws.</description></item>
/// </list>
///
/// <para><b>Retries</b> cover 429 and 5xx with exponential backoff (1s, 2s, 4s, 8s), matching
/// <c>RETRYABLE_STATUS_CODES</c> in the Python version. A 400 or 404 is not retried — those
/// mean the request or model id is wrong, and repeating it only wastes time.</para>
/// </remarks>
public class GroqService : IGroqService
{
    private const string CompletionsUrl = "https://api.groq.com/openai/v1/chat/completions";
    private const int MaxAttempts = 5;

    /// <summary>Statuses worth retrying: rate limiting and transient server faults.</summary>
    private static readonly HashSet<HttpStatusCode> RetryableStatusCodes =
    [
        HttpStatusCode.TooManyRequests,      // 429
        HttpStatusCode.InternalServerError,  // 500
        HttpStatusCode.BadGateway,           // 502
        HttpStatusCode.ServiceUnavailable,   // 503
        HttpStatusCode.GatewayTimeout,       // 504
    ];

    private readonly HttpClient _httpClient;
    private readonly VeonVerseOptions _options;
    private readonly ILogger<GroqService> _logger;

    public GroqService(HttpClient httpClient, VeonVerseOptions options, ILogger<GroqService> logger)
    {
        _httpClient = httpClient;
        _options = options;
        _logger = logger;
    }

    /// <inheritdoc />
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_options.GroqApiKey) &&
        !string.IsNullOrWhiteSpace(_options.GroqModelId);

    /// <inheritdoc />
    public async Task<MentorStructuredResponse> ConverseStructuredAsync(
        string systemPrompt,
        string userPrompt,
        double temperature = 0.4,
        int maxTokens = 1500,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException(
                "Groq is not configured. Set GROQ_API_KEY and GROQ_MODEL_ID in .env.");
        }

        // Restating the contract inside the prompt, as the Python version does. The
        // "no markdown fences" instruction matters — models otherwise wrap JSON in ```json.
        var composedUserPrompt =
            $"{userPrompt}\n\n" +
            "Return strictly valid JSON using this schema. Do not include markdown fences.\n" +
            """Schema: {"step":"string","text":"string","options":["string"] or null,"avatar_state":"string"}""";

        var requestBody = new
        {
            model = _options.GroqModelId,
            temperature,
            max_tokens = maxTokens,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = composedUserPrompt },
            },
        };

        var rawContent = await SendWithRetryAsync(requestBody, cancellationToken);
        return ParseStructuredResponse(rawContent);
    }

    /// <summary>
    /// POSTs the request, retrying transient failures, and returns the assistant's raw
    /// message content.
    /// </summary>
    private async Task<string> SendWithRetryAsync(object requestBody, CancellationToken cancellationToken)
    {
        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, CompletionsUrl)
            {
                Content = JsonContent.Create(requestBody),
            };
            request.Headers.Add("Authorization", $"Bearer {_options.GroqApiKey}");

            using var response = await _httpClient.SendAsync(request, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                var payload = await response.Content.ReadFromJsonAsync<JsonNode>(cancellationToken);

                var content = payload?["choices"]?[0]?["message"]?["content"]?.GetValue<string>();

                if (string.IsNullOrWhiteSpace(content))
                {
                    throw new InvalidOperationException("Groq returned an empty message content.");
                }

                return content;
            }

            var shouldRetry = RetryableStatusCodes.Contains(response.StatusCode) && attempt < MaxAttempts;

            if (!shouldRetry)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Groq call failed with {StatusCode}. Body: {Body}",
                    (int)response.StatusCode,
                    errorBody);

                // A 404 here almost always means GROQ_MODEL_ID names a decommissioned model.
                throw new HttpRequestException(
                    $"Groq request failed with status {(int)response.StatusCode}. " +
                    (response.StatusCode == HttpStatusCode.NotFound
                        ? $"Model '{_options.GroqModelId}' was not found — it may have been retired. " +
                          "Check https://console.groq.com/docs/models for current ids."
                        : errorBody));
            }

            // Exponential backoff: 1s, 2s, 4s, 8s — same schedule as the Python retry loop.
            var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt - 1));
            _logger.LogWarning(
                "Groq call returned {StatusCode}; retrying in {Delay}s (attempt {Attempt}/{MaxAttempts}).",
                (int)response.StatusCode, delay.TotalSeconds, attempt, MaxAttempts);

            await Task.Delay(delay, cancellationToken);
        }

        throw new HttpRequestException($"Groq request failed after {MaxAttempts} attempts.");
    }

    /// <summary>
    /// Parses the model's JSON string and checks that all four required keys are present.
    /// </summary>
    /// <remarks>
    /// <c>options</c> is genuinely polymorphic — an array of strings at the intro step, null
    /// everywhere else — so it is read from the JSON tree by hand rather than through
    /// automatic deserialization, which would need a custom converter to accept both.
    /// </remarks>
    private static MentorStructuredResponse ParseStructuredResponse(string rawContent)
    {
        JsonNode? root;

        try
        {
            root = JsonNode.Parse(rawContent);
        }
        catch (JsonException exception)
        {
            throw new InvalidOperationException(
                $"Groq returned content that is not valid JSON: {rawContent}", exception);
        }

        if (root is null)
        {
            throw new InvalidOperationException("Groq returned a null JSON document.");
        }

        foreach (var requiredKey in new[] { "step", "text", "options", "avatar_state" })
        {
            if (root[requiredKey] is null && root.AsObject().ContainsKey(requiredKey) is false)
            {
                throw new InvalidOperationException(
                    $"Groq structured output missing key: {requiredKey}");
            }
        }

        List<string>? options = null;

        if (root["options"] is JsonArray optionsArray)
        {
            options = optionsArray
                .Select(node => node?.GetValue<string>() ?? string.Empty)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .ToList();
        }

        return new MentorStructuredResponse(
            Step: root["step"]?.GetValue<string>() ?? string.Empty,
            Text: root["text"]?.GetValue<string>() ?? string.Empty,
            Options: options,
            AvatarState: root["avatar_state"]?.GetValue<string>() ?? string.Empty);
    }
}
