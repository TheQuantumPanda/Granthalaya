namespace Library_Management_System.DTOs;

public sealed record BorrowRecordPageDto(IReadOnlyList<BorrowRecordDto> Records, int CurrentPage, int TotalPages, int TotalItems);

public class BorrowRecordDto
{
    public int BorrowRecordId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public int BookCopyId { get; set; }
    public int BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public string AccessionNumber { get; set; } = string.Empty;
    public DateTime BorrowDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ReturnDate { get; set; }
}
