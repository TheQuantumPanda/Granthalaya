namespace Library_Management_System.DTOs;

public class DashboardMetricsDto
{
    public int TotalStudents { get; set; }
    public int TotalBooks { get; set; }
    public int TotalLibrarians { get; set; }
    public int TotalBorrowings { get; set; }
    public int TotalPublications { get; set; }
    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }
    public int BorrowedCopies { get; set; }
    public int ActiveLoans { get; set; }
    public int ReturnedLoans { get; set; }
    public int OverdueLoans { get; set; }
    public List<BorrowRecordDto> RecentActivity { get; set; } = new();
    public Dictionary<string, int> GenreTitleCounts { get; set; } = new();
}
