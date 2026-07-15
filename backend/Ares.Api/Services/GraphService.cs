using Ares.Api.Models;
using Azure.Identity;
using Microsoft.Extensions.Options;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using Microsoft.Graph.Users.Item.SendMail;

namespace Ares.Api.Services;

// ---- Import DTOs returned to the admin UI ---------------------------------
public record GraphGroupDto(string Id, string DisplayName, string? Mail, string? Description, int? MemberCount);
public record GraphAppDto(string Id, string DisplayName, string? AppId);
public record GraphPrincipalDto(string EntraId, string Name, string Email, string Type);

/// <summary>
/// Application-only Microsoft Graph access (client-credentials). Used to import
/// principals from Entra (groups / enterprise-app assignments) and to release
/// notification email from the shared mailbox. This client has NO user context
/// and NO production write access beyond Mail.Send on the scoped mailbox.
/// </summary>
public class GraphService
{
    private readonly EntraOptions _entra;
    private readonly ILogger<GraphService> _log;
    private readonly GraphServiceClient? _graph;

    public GraphService(IOptions<EntraOptions> entra, ILogger<GraphService> log)
    {
        _entra = entra.Value;
        _log = log;

        if (_entra.IsConfigured)
        {
            var credential = new ClientSecretCredential(
                _entra.TenantId, _entra.ClientId, _entra.ClientSecret);
            _graph = new GraphServiceClient(credential, new[] { "https://graph.microsoft.com/.default" });
        }
    }

    public bool IsConfigured => _graph is not null;

    private GraphServiceClient Client =>
        _graph ?? throw new InvalidOperationException(
            "Microsoft Graph is not configured. Set Entra:TenantId / ClientId / ClientSecret.");

    // ---- Groups -----------------------------------------------------------
    public async Task<List<GraphGroupDto>> SearchGroupsAsync(string? query, CancellationToken ct = default)
    {
        var page = await Client.Groups.GetAsync(rc =>
        {
            rc.QueryParameters.Select = new[] { "id", "displayName", "mail", "description" };
            rc.QueryParameters.Top = 50;
            rc.QueryParameters.Orderby = new[] { "displayName" };
            if (!string.IsNullOrWhiteSpace(query))
                rc.QueryParameters.Filter = $"startswith(displayName,'{Escape(query)}')";
        }, ct);

        return (page?.Value ?? new()).Select(g =>
            new GraphGroupDto(g.Id!, g.DisplayName ?? "(unnamed group)", g.Mail, g.Description, null)).ToList();
    }

    public async Task<List<GraphPrincipalDto>> GetGroupMembersAsync(string groupId, CancellationToken ct = default)
    {
        var members = new List<GraphPrincipalDto>();
        var page = await Client.Groups[groupId].Members.GetAsync(rc =>
        {
            rc.QueryParameters.Top = 100;
        }, ct);

        foreach (var m in page?.Value ?? new())
        {
            switch (m)
            {
                case User u:
                    members.Add(new GraphPrincipalDto(u.Id!, u.DisplayName ?? u.UserPrincipalName ?? "(user)",
                        u.Mail ?? u.UserPrincipalName ?? "", "user"));
                    break;
                case Group g:
                    members.Add(new GraphPrincipalDto(g.Id!, g.DisplayName ?? "(group)", g.Mail ?? "", "group"));
                    break;
            }
        }
        return members;
    }

    // ---- Enterprise apps (service principals) -----------------------------
    public async Task<List<GraphAppDto>> SearchEnterpriseAppsAsync(string? query, CancellationToken ct = default)
    {
        var page = await Client.ServicePrincipals.GetAsync(rc =>
        {
            rc.QueryParameters.Select = new[] { "id", "displayName", "appId" };
            rc.QueryParameters.Top = 50;
            rc.QueryParameters.Orderby = new[] { "displayName" };
            rc.QueryParameters.Filter = string.IsNullOrWhiteSpace(query)
                ? "servicePrincipalType eq 'Application'"
                : $"startswith(displayName,'{Escape(query)}')";
        }, ct);

        return (page?.Value ?? new()).Select(s =>
            new GraphAppDto(s.Id!, s.DisplayName ?? "(unnamed app)", s.AppId)).ToList();
    }

    /// <summary>Users and groups assigned to an enterprise app (appRoleAssignedTo).</summary>
    public async Task<List<GraphPrincipalDto>> GetAppAssignedPrincipalsAsync(string spId, CancellationToken ct = default)
    {
        var result = new List<GraphPrincipalDto>();
        var page = await Client.ServicePrincipals[spId].AppRoleAssignedTo.GetAsync(rc =>
        {
            rc.QueryParameters.Top = 100;
        }, ct);

        foreach (var a in page?.Value ?? new())
        {
            if (a.PrincipalId is null) continue;
            var type = (a.PrincipalType ?? "User").Equals("Group", StringComparison.OrdinalIgnoreCase) ? "group" : "user";
            var email = "";
            if (type == "user")
            {
                try
                {
                    var u = await Client.Users[a.PrincipalId.ToString()!].GetAsync(rc =>
                        rc.QueryParameters.Select = new[] { "mail", "userPrincipalName" }, ct);
                    email = u?.Mail ?? u?.UserPrincipalName ?? "";
                }
                catch (Exception ex) { _log.LogWarning(ex, "Could not resolve email for principal {Id}", a.PrincipalId); }
            }
            result.Add(new GraphPrincipalDto(a.PrincipalId.ToString()!, a.PrincipalDisplayName ?? "(principal)", email, type));
        }
        return result;
    }

    // ---- Email ------------------------------------------------------------
    public async Task SendMailAsync(string sender, string subject, string body,
        IEnumerable<string> to, IEnumerable<string> bcc, bool saveToSent, CancellationToken ct = default)
    {
        var message = new Message
        {
            Subject = subject,
            Body = new ItemBody { ContentType = BodyType.Text, Content = body },
            ToRecipients = to.Where(NotEmpty).Select(Recipient).ToList(),
            BccRecipients = bcc.Where(NotEmpty).Select(Recipient).ToList(),
        };

        await Client.Users[sender].SendMail.PostAsync(new SendMailPostRequestBody
        {
            Message = message,
            SaveToSentItems = saveToSent
        }, cancellationToken: ct);

        _log.LogInformation("Graph sendMail: from={Sender} to={To} bcc={Bcc} subject={Subject}",
            sender, message.ToRecipients.Count, message.BccRecipients.Count, subject);
    }

    // ---- Teams war room ---------------------------------------------------
    /// <summary>Create a standard channel for the incident under the ops Team. Returns (channelId, webUrl).</summary>
    public async Task<(string channelId, string? webUrl)> CreateWarRoomChannelAsync(string teamId, Incident inc, CancellationToken ct = default)
    {
        var channel = new Channel
        {
            DisplayName = ChannelName(inc),
            Description = Truncate($"{inc.Sev} · {inc.Impact}", 1024),
            MembershipType = ChannelMembershipType.Standard,
        };
        var created = await Client.Teams[teamId].Channels.PostAsync(channel, cancellationToken: ct);
        _log.LogInformation("Teams channel created for {Incident}: {ChannelId}", inc.Id, created?.Id);
        return (created?.Id ?? "", created?.WebUrl);
    }

    /// <summary>Post an Adaptive Card as a channel message.</summary>
    public async Task PostAdaptiveCardAsync(string teamId, string channelId, string cardJson, CancellationToken ct = default)
    {
        var attachmentId = Guid.NewGuid().ToString();
        var message = new ChatMessage
        {
            Body = new ItemBody { ContentType = BodyType.Html, Content = $"<attachment id=\"{attachmentId}\"></attachment>" },
            Attachments = new List<ChatMessageAttachment>
            {
                new()
                {
                    Id = attachmentId,
                    ContentType = "application/vnd.microsoft.card.adaptive",
                    Content = cardJson,
                }
            }
        };
        await Client.Teams[teamId].Channels[channelId].Messages.PostAsync(message, cancellationToken: ct);
        _log.LogInformation("Adaptive card posted to team {Team} channel {Channel}", teamId, channelId);
    }

    // Teams channel display names: max 50 chars, and cannot contain # % & * { } / \ : < > ? + | " ' or tabs.
    private static string ChannelName(Incident inc)
    {
        var raw = $"{inc.Id} — {inc.Title}";
        var cleaned = new string(raw.Where(c => !"#%&*{}/\\:<>?+|\"'\t".Contains(c)).ToArray()).Trim();
        return Truncate(cleaned, 50);
    }
    private static string Truncate(string s, int max) => s.Length <= max ? s : s[..max];

    private static bool NotEmpty(string s) => !string.IsNullOrWhiteSpace(s);
    private static Recipient Recipient(string address) =>
        new() { EmailAddress = new EmailAddress { Address = address.Trim() } };

    // Basic OData string-literal escaping (single quotes).
    private static string Escape(string s) => s.Replace("'", "''");
}
