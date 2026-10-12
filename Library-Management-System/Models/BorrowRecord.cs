namespace Library_Management_System.Models;

public class BorrowRecord
{
    public int BorrowRecordId { get; set; }
    public int StudentId { get; set; }
    public int BookCopyId { get; set; }
    public DateTime BorrowDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ReturnDate { get; set; }
    public Student Student { get; set; } = null!;
    public BookCopy BookCopy { get; set; } = null!;
}
