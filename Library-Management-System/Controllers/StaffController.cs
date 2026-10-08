using Library_Management_System.DTOs;
using Library_Management_System.Security;
using Library_Management_System.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Library_Management_System.Controllers;

[ApiController, Route("api/staff"), Authorize(Policy = StaffSecurity.Admin)]
public sealed class StaffController(IStaffAccountsService staff) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StaffProfileDto>>> List(CancellationToken ct) => Ok(await staff.ListAsync(ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<StaffProfileDto>> Get(string id, CancellationToken ct) =>
        await staff.GetAsync(id, ct) is { } result ? Ok(result) : NotFound();

    [HttpPost]
    public async Task<ActionResult<StaffProfileDto>> Create([FromBody] CreateStaffDto request)
    {
        var result = await staff.CreateLibrarianAsync(request);
        return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
    }

    [HttpPut("{id}/role")]
    public async Task<ActionResult<StaffProfileDto>> ChangeRole(string id, [FromBody] ChangeStaffRoleDto request, CancellationToken ct) =>
        await staff.ChangeRoleAsync(id, request.Role, ct) is { } result ? Ok(result) : NotFound();

    [HttpPost("{id}/enable")]
    public async Task<IActionResult> Enable(string id, CancellationToken ct) =>
        await staff.EnableAsync(id, ct) ? NoContent() : NotFound();

    [HttpPost("{id}/disable")]
    public async Task<IActionResult> Disable(string id, CancellationToken ct) =>
        await staff.DisableAsync(id, ct) ? NoContent() : NotFound();
}
