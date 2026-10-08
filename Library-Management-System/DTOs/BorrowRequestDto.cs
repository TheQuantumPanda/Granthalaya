using System.ComponentModel.DataAnnotations;

namespace Library_Management_System.DTOs;

public class BorrowRequestDto
{
    [Range(1, int.MaxValue)] public int StudentId { get; set; }
    [Range(1, int.MaxValue)] public int BookCopyId { get; set; }
    [Required] public DateTime DueDate { get; set; }
}
