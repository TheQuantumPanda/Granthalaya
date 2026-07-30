using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Library_Management_System.Models;

public class BorrowRecord
{
    [Key]
    public int BorrowRecordId { get; set; }

    [ForeignKey(nameof(Book))]
    public int BookId { get; set; }

    public string BorrowerName { get; set; } = string.Empty;

    public string BorrowerEmail { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public DateTime BorrowDate { get; set; }

    public DateTime? ReturnDate { get; set; }

    // Navigation property
    public Book Book { get; set; } = null!;
}
