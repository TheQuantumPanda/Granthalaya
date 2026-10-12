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
    public DbSet<BookCopy> BookCopies { get; set; }
    public DbSet<BorrowRecord> BorrowRecords { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<Librarian> Librarians { get; set; }
    public DbSet<Publication> Publications { get; set; }
    public DbSet<ContactMessage> ContactMessages { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Book>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(250).IsRequired();
            entity.Property(x => x.Author).HasMaxLength(200).IsRequired();
            entity.Property(x => x.ISBN).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Genre).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Publisher).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(2000).IsRequired();
            entity.HasIndex(x => x.ISBN).IsUnique();
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_Books_PublicationYear", "[PublicationYear] BETWEEN 1450 AND 2200");
                t.HasCheckConstraint("CK_Books_ISBN_NotBlank", "LEN(LTRIM(RTRIM([ISBN]))) > 0");
            });
        });

        builder.Entity<BookCopy>(entity =>
        {
            entity.Property(x => x.AccessionNumber).HasMaxLength(64).IsRequired();
            entity.Property(x => x.Condition).HasMaxLength(100).IsRequired();
            entity.HasIndex(x => x.AccessionNumber).IsUnique();
            entity.HasIndex(x => x.BookId);
            entity.HasOne(x => x.Book).WithMany(x => x.BookCopies)
                .HasForeignKey(x => x.BookId).OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_BookCopies_Status", "[Status] BETWEEN 0 AND 3");
                t.HasCheckConstraint("CK_BookCopies_AccessionNumber_NotBlank", "LEN(LTRIM(RTRIM([AccessionNumber]))) > 0");
            });
        });

        builder.Entity<Student>(entity =>
        {
            entity.Property(x => x.StudentName).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(254).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(30).IsRequired();
            entity.Property(x => x.RegistrationNumber).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Gender).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Address).HasMaxLength(500).IsRequired();
            entity.HasIndex(x => x.RegistrationNumber).IsUnique();
            entity.ToTable(t => t.HasCheckConstraint("CK_Students_RegistrationNumber_NotBlank", "LEN(LTRIM(RTRIM([RegistrationNumber]))) > 0"));
        });

        builder.Entity<BorrowRecord>(entity =>
        {
            entity.HasOne(x => x.Student).WithMany(x => x.BorrowRecords)
                .HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.BookCopy).WithMany(x => x.BorrowRecords)
                .HasForeignKey(x => x.BookCopyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => x.StudentId);
            entity.HasIndex(x => new { x.BorrowDate, x.BorrowRecordId });
            entity.HasIndex(x => x.BookCopyId).IsUnique()
                .HasFilter("[ReturnDate] IS NULL").HasDatabaseName("UX_BorrowRecords_ActiveCopy");
            entity.Property(x => x.ReturnDate).IsConcurrencyToken();
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_BorrowRecords_Dates", "[DueDate] > [BorrowDate] AND ([ReturnDate] IS NULL OR [ReturnDate] >= [BorrowDate])");
            });
        });

        builder.Entity<ContactMessage>().HasIndex(x => new { x.SubmittedAt, x.Id });
    }
}
