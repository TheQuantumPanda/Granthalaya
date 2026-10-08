namespace Library_Management_System.Models;

// Loan state is derived from BorrowRecords. This status describes physical eligibility.
public enum CopyStatus { Circulating, Maintenance, Lost, Retired }

public class BookCopy
{
    public int BookCopyId { get; set; }
    public int BookId { get; set; }
    public string AccessionNumber { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    public CopyStatus Status { get; set; } = CopyStatus.Circulating;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Book Book { get; set; } = null!;
    public ICollection<BorrowRecord> BorrowRecords { get; set; } = new List<BorrowRecord>();
}
