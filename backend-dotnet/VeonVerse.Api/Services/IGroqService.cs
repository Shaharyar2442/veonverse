using VeonVerse.Api.Dtos;

namespace VeonVerse.Api.Services;

/// <summary>
/// A language model that answers in a fixed JSON shape.
/// </summary>
public interface IGroqService
{
    /// <summary>
    /// True when an API key and model id are both present. When false, callers fall back to
    /// canned mentor text instead of failing the request.
    /// </summary>
    bool IsConfigured { get; }

    /// <summary>
    /// Sends a system and user prompt, and returns the parsed, validated structured reply.
    /// </summary>
    /// <param name="temperature">0.4 by default — enough variation to feel human, little enough to stay on-task.</param>
    /// <param name="maxTokens">
    /// Output budget. Higher than the Python default of 700 because reasoning models
    /// (such as the gpt-oss family) spend tokens thinking before they emit the JSON, and a
    /// truncated response is unparseable.
    /// </param>
    /// <exception cref="InvalidOperationException">Not configured, or the reply was not valid JSON with all four keys.</exception>
    /// <exception cref="HttpRequestException">The API call failed and could not be retried.</exception>
    Task<MentorStructuredResponse> ConverseStructuredAsync(
        string systemPrompt,
        string userPrompt,
        double temperature = 0.4,
        int maxTokens = 1500,
        CancellationToken cancellationToken = default);
}
