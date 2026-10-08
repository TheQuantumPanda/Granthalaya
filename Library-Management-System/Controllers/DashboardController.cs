using Microsoft.AspNetCore.Authorization;
using Library_Management_System.Security;
using Microsoft.AspNetCore.Mvc;
using Library_Management_System.DTOs;
using Library_Management_System.Services;

namespace Library_Management_System.Controllers;

[Authorize(Policy = StaffSecurity.Staff)]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    // GET /api/dashboard
    [HttpGet]
    public async Task<ActionResult<DashboardMetricsDto>> GetDashboardMetrics()
    {
        var metrics = await _dashboardService.GetMetricsAsync();
        return Ok(metrics);
    }
}
