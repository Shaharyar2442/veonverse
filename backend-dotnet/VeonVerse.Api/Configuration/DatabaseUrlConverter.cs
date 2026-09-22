using Npgsql;

namespace VeonVerse.Api.Configuration;

/// <summary>
/// Translates a SQLAlchemy-style database URL into an Npgsql connection string.
/// </summary>
/// <remarks>
/// <para><b>The problem.</b> The shared <c>.env</c> holds:</para>
/// <code>DATABASE_URL=postgresql+psycopg2://veonverse:veonverse@localhost:15432/veonverse</code>
/// <para>SQLAlchemy understands that URL. Npgsql does not — it wants:</para>
/// <code>Host=localhost;Port=15432;Database=veonverse;Username=veonverse;Password=veonverse</code>
/// <para>This class bridges the two so one <c>.env</c> keeps serving both backends.</para>
///
/// <para><b>The <c>+psycopg2</c> part</b> is SQLAlchemy's driver selector. It has no meaning
/// outside Python, so it is stripped before parsing. <c>postgresql://</c>, <c>postgres://</c>
/// and the <c>+driver</c> variants are all accepted.</para>
/// </remarks>
public static class DatabaseUrlConverter
{
    /// <summary>
    /// Converts <paramref name="databaseUrl"/> to an Npgsql connection string.
    /// A value that is already in Npgsql key/value form is returned unchanged, so this is
    /// safe to call on whatever the configuration happens to contain.
    /// </summary>
    public static string ToNpgsqlConnectionString(string databaseUrl)
    {
        if (string.IsNullOrWhiteSpace(databaseUrl))
        {
            throw new ArgumentException("DATABASE_URL is empty. Set it in .env or appsettings.json.", nameof(databaseUrl));
        }

        // Already key/value form (contains '=' before any '://') — pass straight through.
        if (!databaseUrl.Contains("://", StringComparison.Ordinal))
        {
            return databaseUrl;
        }

        // Drop SQLAlchemy's driver suffix: "postgresql+psycopg2://" -> "postgresql://".
        var schemeEnd = databaseUrl.IndexOf("://", StringComparison.Ordinal);
        var scheme = databaseUrl[..schemeEnd];
        var remainder = databaseUrl[(schemeEnd + 3)..];

        var plusIndex = scheme.IndexOf('+');
        if (plusIndex >= 0)
        {
            scheme = scheme[..plusIndex];
        }

        if (!scheme.Equals("postgresql", StringComparison.OrdinalIgnoreCase) &&
            !scheme.Equals("postgres", StringComparison.OrdinalIgnoreCase))
        {
            throw new NotSupportedException(
                $"Only PostgreSQL is supported, but DATABASE_URL uses scheme '{scheme}'. " +
                "The vector search depends on the pgvector extension.");
        }

        // Uri gives correct handling of percent-encoded passwords, IPv6 hosts and default ports.
        var uri = new Uri($"postgresql://{remainder}");

        var userInfo = uri.UserInfo.Split(':', 2);
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            // uri.Port is -1 when the URL omits it; fall back to the PostgreSQL default.
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = username,
            Password = password,
        };

        return builder.ConnectionString;
    }
}
