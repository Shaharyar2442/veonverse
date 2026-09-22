namespace VeonVerse.Api.Configuration;

/// <summary>
/// Reads a <c>.env</c> file into an in-memory dictionary so it can be layered into the
/// standard .NET configuration system.
/// </summary>
/// <remarks>
/// <para><b>Why this exists.</b> Python's <c>pydantic-settings</c> reads <c>.env</c> out of
/// the box. .NET does not — it expects <c>appsettings.json</c> and environment variables.
/// Rather than force you to maintain configuration in two places, this loader parses the
/// same repo-root <c>.env</c> the Python backend uses, so a single file drives both stacks.</para>
///
/// <para><b>Format supported.</b> <c>KEY=VALUE</c> one per line. Blank lines and lines
/// starting with <c>#</c> are skipped. Surrounding single or double quotes are stripped.
/// Everything after the first <c>=</c> is the value, so values may contain <c>=</c>
/// (important: connection strings and API keys often do).</para>
///
/// <para>This deliberately does <i>not</i> support multi-line values, variable expansion or
/// <c>export</c> prefixes — the project's <c>.env</c> uses none of them, and a small
/// predictable parser is easier to trust than a clever one.</para>
/// </remarks>
public static class DotEnvLoader
{
    /// <summary>
    /// Parses the given .env file. Returns an empty dictionary if the file does not exist,
    /// so a missing .env is simply "no overrides" rather than a startup crash.
    /// </summary>
    public static Dictionary<string, string?> Load(string path)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);

        if (!File.Exists(path))
        {
            return values;
        }

        foreach (var rawLine in File.ReadAllLines(path))
        {
            var line = rawLine.Trim();

            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim();

            // Strip a matching pair of surrounding quotes, if present.
            if (value.Length >= 2 &&
                ((value[0] == '"' && value[^1] == '"') || (value[0] == '\'' && value[^1] == '\'')))
            {
                value = value[1..^1];
            }

            values[key] = value;
        }

        return values;
    }

    /// <summary>
    /// Walks up from <paramref name="startDirectory"/> looking for a <c>.env</c> file,
    /// mirroring how <c>backend/app/config.py</c> resolves the repo root by absolute path.
    /// </summary>
    /// <remarks>
    /// Needed because the app's working directory differs depending on how it was started
    /// (<c>dotnet run</c> from the project folder, <c>dotnet exec</c> from bin/, an IDE, a
    /// container). Searching upward makes all of those behave the same.
    /// </remarks>
    /// <returns>The full path to the nearest .env, or null if none was found.</returns>
    public static string? FindEnvFile(string startDirectory, int maxLevels = 6)
    {
        var directory = new DirectoryInfo(startDirectory);

        for (var level = 0; level < maxLevels && directory is not null; level++)
        {
            var candidate = Path.Combine(directory.FullName, ".env");
            if (File.Exists(candidate))
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        return null;
    }
}
