using Library_Management_System.DTOs;

namespace Library_Management_System.Services;

public interface IDashboardService
{
    Task<DashboardMetricsDto> GetMetricsAsync();
}
