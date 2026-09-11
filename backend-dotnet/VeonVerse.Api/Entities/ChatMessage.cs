namespace VeonVerse.Api.Entities;

/// <summary>
/// Audit log of every turn in the conversation, from both sides.
/// Python equivalent: <c>class ChatMessage</c> in <c>backend/app/models.py</c>.
/// Table: <c>chat_messages</c>.
/// </summary>
/// <remarks>
/// Written by both the lesson flow and the mentor endpoint. Nothing reads it back yet —
/// it exists so the grounding of any past answer can be audited after the fact, which is
/// why <see cref="RetrievedChunkIds"/> is stored alongside the text.
/// </remarks>
public class ChatMessage
{
    public int Id { get; set; }

    public int UserId { get; set; }

    /// <summary>"user" or "assistant".</summary>
    public string Role { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Ids of the leadership chunks retrieved to ground this message, stored as a JSON array.
    /// Null for turns that did not involve retrieval.
    /// </summary>
    public List<string>? RetrievedChunkIds { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
