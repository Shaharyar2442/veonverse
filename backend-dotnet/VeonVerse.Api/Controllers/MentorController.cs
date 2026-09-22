using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VeonVerse.Api.Configuration;
using VeonVerse.Api.Data;
using VeonVerse.Api.Dtos;
using VeonVerse.Api.Entities;
using VeonVerse.Api.Services;

namespace VeonVerse.Api.Controllers;

/// <summary>
/// Free-form question answering, grounded in the leadership material.
/// Python equivalent: the <c>ask_mentor</c> route in <c>backend/app/main.py</c>.
/// </summary>
/// <remarks>
/// <para>This is the clearest example of RAG in the codebase, in four moves: <b>retrieve</b>
/// the passages closest to the question, <b>augment</b> a prompt with them, <b>generate</b> an
/// answer constrained to that context, and return the chunk ids so the answer can be checked
/// against its sources.</para>
///
/// <para>Unlike the lesson flow, there is no fallback here. If the model call fails the
/// request fails, because a mentor answer with no model behind it would be a fabrication
/// presented as guidance. A broken lesson step can show generic encouragement; a broken
/// answer cannot pretend to be an answer.</para>
/// </remarks>
[ApiController]
[Route("mentor")]
public class MentorController : ControllerBase
{
    private const string MentorSystemPrompt =
        "You are a grounded leadership mentor. Use only provided context.";

    private readonly VeonVerseDbContext _dbContext;
    private readonly IRetrievalService _retrievalService;
    private readonly IGroqService _groqService;
    private readonly VeonVerseOptions _options;

    public MentorController(
        VeonVerseDbContext dbContext,
        IRetrievalService retrievalService,
        IGroqService groqService,
        VeonVerseOptions options)
    {
        _dbContext = dbContext;
        _retrievalService = retrievalService;
        _groqService = groqService;
        _options = options;
    }

    /// <summary>
    /// Answers a question using only the retrieved leadership passages.
    /// </summary>
    /// <remarks>POST /mentor/ask with <c>{"user_id": 1, "question": "...", "principle_id": 1}</c>.</remarks>
    [HttpPost("ask")]
    public async Task<ActionResult<MentorAskResponse>> AskMentor(
        [FromBody] MentorAskRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user is null)
        {
            return NotFound(new { detail = $"User {request.UserId} not found." });
        }

        // --- Retrieve ---
        var chunks = await _retrievalService.RetrieveContextAsync(
            query: request.Question,
            principleId: request.PrincipleId ?? _options.DefaultPrincipleId,
            k: 4,
            cancellationToken: cancellationToken);

        var context = string.Join("\n\n", chunks.Select(chunk => chunk.ChunkText));
        var sources = chunks.Select(chunk => chunk.Id).ToList();

        // --- Augment ---
        // The instruction to admit insufficiency is what keeps the model from filling gaps
        // with plausible invention when the retrieved passages do not cover the question.
        var prompt =
            "Answer the user question using only the retrieved context. If context is insufficient, " +
            "state that and suggest asking a more specific question.\n\n" +
            $"Question: {request.Question}\n\n" +
            $"Retrieved Context:\n{context}";

        // --- Generate ---
        var modelResponse = await _groqService.ConverseStructuredAsync(
            systemPrompt: MentorSystemPrompt,
            userPrompt: prompt,
            cancellationToken: cancellationToken);

        // --- Record both turns, with the grounding attached ---
        _dbContext.ChatMessages.Add(new ChatMessage
        {
            UserId = request.UserId,
            Role = "user",
            Content = request.Question,
            RetrievedChunkIds = sources,
            CreatedAt = DateTime.UtcNow,
        });

        _dbContext.ChatMessages.Add(new ChatMessage
        {
            UserId = request.UserId,
            Role = "assistant",
            Content = modelResponse.Text,
            RetrievedChunkIds = sources,
            CreatedAt = DateTime.UtcNow,
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new MentorAskResponse(
            // Fixed server-side, so the UI can reuse its lesson renderer for this reply.
            Step: "mentor_ask",
            Text: modelResponse.Text,
            Options: null,
            AvatarState: modelResponse.AvatarState,
            Sources: sources));
    }
}
