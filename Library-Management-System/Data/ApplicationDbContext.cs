using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Library_Management_System.Models;

namespace Library_Management_System.Data;

public class ApplicationDbContext : IdentityDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Book> Books { get; set; }
    public DbSet<BorrowRecord> BorrowRecords { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<Librarian> Librarians { get; set; }
    public DbSet<Publication> Publications { get; set; }
    public DbSet<ContactMessage> ContactMessages { get; set; }
}
