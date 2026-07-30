namespace Library_Management_System.DTOs;

public class BorrowRequestDto
{
    public int BookId { get; set; }
    public string BorrowerName { get; set; } = string.Empty;
    public string BorrowerEmail { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}
