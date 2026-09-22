using Microsoft.AspNetCore.Mvc;
using VeonVerse.Api.Dtos;
using VeonVerse.Api.Services;

namespace VeonVerse.Api.Controllers;

/// <summary>
/// Drives the guided lesson forward one step at a time.
/// Python equivalent: the <c>next_lesson</c> route in <c>backend/app/main.py</c>.
/// </summary>
[ApiController]
[Route("lessons")]
public class LessonsController : ControllerBase
{
    private readonly ILessonService _lessonService;

    public LessonsController(ILessonService lessonService)
    {
        _lessonService = lessonService;
    }

    /// <summary>
    /// Runs the next step of the lesson for this principle.
    /// </summary>
    /// <remarks>
    /// <para>POST /lessons/1/next with body <c>{"user_id": 1, "user_input": "..."}</c>.</para>
    ///
    /// <para>The controller stays deliberately thin: all the sequencing lives in
    /// <see cref="ILessonService"/>. Its only real job is translating a domain error into the
    /// right HTTP status — <see cref="ArgumentException"/> means the caller sent something
    /// unusable (unknown user, unknown principle, missing required answer), which is a 400,
    /// matching the Python version's <c>ValueError</c> handling.</para>
    /// </remarks>
    [HttpPost("{principleId:int}/next")]
    public async Task<ActionResult<LessonStepResponse>> NextLesson(
        int principleId,
        [FromBody] LessonNextRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _lessonService.AdvanceLessonAsync(
                userId: request.UserId,
                principleId: principleId,
                userInput: request.UserInput,
                cancellationToken: cancellationToken);

            return Ok(response);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { detail = exception.Message });
        }
    }
}
