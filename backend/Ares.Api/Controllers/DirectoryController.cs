using Ares.Api.Data;
using Ares.Api.Dtos;
using Ares.Api.Models;
using Ares.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ares.Api.Controllers;

[ApiController]
[Route("api/directory")]
public class DirectoryController : ControllerBase
{
    private readonly AresDbContext _db;
    public DirectoryController(AresDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<DirectoryPrincipal>> List() =>
        await _db.Directory.AsNoTracking().OrderBy(d => d.Type).ThenBy(d => d.Name).ToListAsync();

    [HttpPost]
    public async Task<ActionResult<DirectoryPrincipal>> Add(PrincipalUpsert req)
    {
        var p = new DirectoryPrincipal
        {
            Id = (req.Type == "group" ? "g-" : "u-") + Guid.NewGuid().ToString("N")[..8],
            Name = req.Name, Email = req.Email, Type = req.Type, Roles = req.Roles ?? new()
        };
        _db.Directory.Add(p);
        await _db.SaveChangesAsync();
        return p;
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DirectoryPrincipal>> Update(string id, PrincipalUpsert req)
    {
        var p = await _db.Directory.FindAsync(id);
        if (p is null) return NotFound();
        p.Name = req.Name; p.Email = req.Email; p.Type = req.Type; p.Roles = req.Roles ?? new();
        await _db.SaveChangesAsync();
        return p;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var p = await _db.Directory.FindAsync(id);
        if (p is null) return NotFound();
        _db.Directory.Remove(p);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/roles/{roleKey}/toggle")]
    public async Task<ActionResult<DirectoryPrincipal>> ToggleRole(string id, string roleKey)
    {
        var p = await _db.Directory.FindAsync(id);
        if (p is null) return NotFound();
        var roles = new List<string>(p.Roles);
        if (roles.Contains(roleKey)) roles.Remove(roleKey); else roles.Add(roleKey);
        p.Roles = roles;
        await _db.SaveChangesAsync();
        return p;
    }
}

[ApiController]
[Route("api/meta")]
public class MetaController : ControllerBase
{
    private readonly Microsoft.Extensions.Options.IOptions<EntraOptions> _entra;
    private readonly Microsoft.Extensions.Options.IOptions<MailOptions> _mail;
    private readonly Microsoft.Extensions.Options.IOptions<TeamsOptions> _teams;
    private readonly Microsoft.Extensions.Options.IOptions<AresOptions> _ares;
    public MetaController(
        Microsoft.Extensions.Options.IOptions<EntraOptions> entra,
        Microsoft.Extensions.Options.IOptions<MailOptions> mail,
        Microsoft.Extensions.Options.IOptions<TeamsOptions> teams,
        Microsoft.Extensions.Options.IOptions<AresOptions> ares)
    { _entra = entra; _mail = mail; _teams = teams; _ares = ares; }

    [HttpGet("roles")]
    public IEnumerable<RoleDef> Roles() => RolesCatalogue.All;

    [HttpGet("config")]
    public object Config() => new
    {
        entraConfigured = _entra.Value.IsConfigured,
        mailSender = _mail.Value.Sender,
        teamsConfigured = _teams.Value.IsConfigured,
        demoAuth = _ares.Value.AllowDemoAuth
    };
}
