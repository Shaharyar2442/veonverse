namespace VeonVerse.Api.Dtos;

/// <summary>
/// A principle as returned to the client, with this user's progress folded in.
/// Python equivalent: <c>class PrincipleItem</c> in <c>backend/app/schemas.py</c>.
/// </summary>
/// <remarks>
/// <para>These are C# <c>record</c> types: immutable value objects with compiler-generated
/// equality. They are the .NET analogue of Pydantic models — the shape of data crossing the
/// HTTP boundary, kept separate from the EF entities that describe database rows.</para>
///
/// <para><b>Why separate DTOs at all?</b> <see cref="Entities.Principle"/> has no notion of
/// a per-user status; the API response does. Keeping them apart means the database schema
/// and the wire format can change independently.</para>
///
/// <para><b>Property naming.</b> Written in PascalCase here, but serialized as snake_case
/// (<c>official_text</c>, <c>psychometric_tension</c>) by the global JSON naming policy set
/// in <c>Program.cs</c>. That policy is what lets the existing React frontend talk to this
/// API without a single change.</para>
/// </remarks>
public record PrincipleItem(
    int Id,
    int Number,
    string Title,
    string OfficialText,
    string Summary,
    string? PsychometricTension,
    string? HoganCompetencies,
    string? BehavioralDomains,
    string Status
);

/// <summary>
/// Wrapper for the principle list.
/// Python equivalent: <c>class PrincipleListResponse</c>.
/// </summary>
/// <remarks>
/// The list is wrapped in an object rather than returned as a bare JSON array. That matches
/// the Python API exactly — the frontend reads <c>response.principles</c> — and leaves room
/// to add paging metadata later without breaking clients.
/// </remarks>
public record PrincipleListResponse(IReadOnlyList<PrincipleItem> Principles);
