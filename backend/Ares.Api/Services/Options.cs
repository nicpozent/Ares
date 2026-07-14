namespace Ares.Api.Services;

public class EntraOptions
{
    public string Instance { get; set; } = "https://login.microsoftonline.com/";
    public string TenantId { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
    public string ApiAudience { get; set; } = "";

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(TenantId) &&
        !string.IsNullOrWhiteSpace(ClientId) &&
        !string.IsNullOrWhiteSpace(ClientSecret);
}

public class MailOptions
{
    public string Sender { get; set; } = "global.it.communications@birgma.com";
    public bool SaveToSentItems { get; set; } = true;
}

public class AresOptions
{
    public bool AllowDemoAuth { get; set; } = true;
    public string[] CorsOrigins { get; set; } = Array.Empty<string>();
}
