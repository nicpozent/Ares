using Ares.Api.Models;

namespace Ares.Api.Dtos;

public record DeclareRequest(
    string? Title, string? Impact, string? ServiceName, string? Country,
    SeverityDimensions Sel, string? Status);

public record IncidentPatch(string? Impact, string? Status, string? Title, string? Duration);

public record AssignRequest(string? UserId);

public record CommsEditRequest(string Body);

public record LinkRequest(string OtherId, string? Rel);

public record ChildPatch(
    // union of editable child fields; only the relevant ones are read per collection
    string? Text, string? T, string? Type, string? Src,
    string? Title, string? ForE, string? AgainstE, string? Owner, string? Status,
    string? Kind, string? Source, string? Ref, string? By, string? Note,
    string? Desc, string? Due, string? Prio);

public record PrincipalUpsert(string Name, string Email, string Type, List<string> Roles);

public record ImportRequest(List<GraphImportItem> Principals);
public record GraphImportItem(string EntraId, string Name, string Email, string Type, string? Source, List<string>? Roles);

public record SendEmailRequest(
    string IncidentId, string Key, string Subject, string Body,
    Dictionary<string, string> Recips); // principalId -> "to" | "bcc"
