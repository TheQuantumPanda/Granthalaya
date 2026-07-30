using System.ComponentModel.DataAnnotations;

namespace Library_Management_System.Models;

public class Librarian
{
    [Key]
    public int LibrarianId { get; set; }

    public string Name { get; set; } = string.Empty;

    public int Age { get; set; }

    public string Phone { get; set; } = string.Empty;
}
