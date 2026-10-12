using Library_Management_System.Models;

namespace Library_Management_System.Data;

public static class DbInitializer
{
    public static void Seed(ApplicationDbContext context)
    {
        // Seed Books
        if (!context.Books.Any())
        {
            context.Books.AddRange(
                new Book
                {
                    Title = "The Pragmatic Programmer",
                    Author = "David Thomas & Andrew Hunt",
                    ISBN = "978-0135957059",
                    PublicationYear = 2019,
                    Genre = "Technology"
                },
                new Book
                {
                    Title = "Clean Code",
                    Author = "Robert C. Martin",
                    ISBN = "978-0132350884",
                    PublicationYear = 2008,
                    Genre = "Technology"
                },
                new Book
                {
                    Title = "Design Patterns using C#",
                    Author = "Erich Gamma et al.",
                    ISBN = "978-0201633610",
                    PublicationYear = 1994,
                    Genre = "Technology"
                },
                new Book
                {
                    Title = "Introduction to Algorithms",
                    Author = "Thomas H. Cormen",
                    ISBN = "978-0262033848",
                    PublicationYear = 2009,
                    Genre = "Technology"
                },
                new Book
                {
                    Title = "The Art of Computer Programming",
                    Author = "Donald E. Knuth",
                    ISBN = "978-0201896831",
                    PublicationYear = 1997,
                    Genre = "Technology"
                },
                new Book
                {
                    Title = "Structure and Interpretation of Computer Programs",
                    Author = "Harold Abelson & Gerald Jay Sussman",
                    ISBN = "978-0262510875",
                    PublicationYear = 1996,
                    Genre = "Technology"
                }
            );
            context.SaveChanges();
        }

        var sampleIsbns = new HashSet<string>
        {
            "978-0135957059", "978-0132350884", "978-0201633610",
            "978-0262033848", "978-0201896831", "978-0262510875"
        };
        foreach (var book in context.Books.Where(b => sampleIsbns.Contains(b.ISBN)).ToList())
        {
            var accession = $"SAMPLE-{book.ISBN}";
            if (!context.BookCopies.Any(c => c.AccessionNumber == accession))
                context.BookCopies.Add(new BookCopy { BookId = book.BookId, AccessionNumber = accession, Condition = "Good" });
        }
        context.SaveChanges();

        // Seed Students
        if (!context.Students.Any())
        {
            context.Students.AddRange(
                new Student
                {
                    StudentName = "Alice Johnson",
                    RegistrationNumber = "SAMPLE-001",
                    Email = "alice.johnson@university.edu",
                    Phone = "555-0101",
                    Gender = "Female",
                    Address = "123 Elm Street, Springfield"
                },
                new Student
                {
                    StudentName = "Bob Smith",
                    RegistrationNumber = "SAMPLE-002",
                    Email = "bob.smith@university.edu",
                    Phone = "555-0102",
                    Gender = "Male",
                    Address = "456 Oak Avenue, Shelbyville"
                },
                new Student
                {
                    StudentName = "Charlie Brown",
                    RegistrationNumber = "SAMPLE-003",
                    Email = "charlie.brown@university.edu",
                    Phone = "555-0103",
                    Gender = "Male",
                    Address = "789 Pine Road, Capital City"
                },
                new Student
                {
                    StudentName = "Diana Prince",
                    RegistrationNumber = "SAMPLE-004",
                    Email = "diana.prince@university.edu",
                    Phone = "555-0104",
                    Gender = "Female",
                    Address = "321 Maple Lane, Metropolis"
                },
                new Student
                {
                    StudentName = "Ethan Hunt",
                    RegistrationNumber = "SAMPLE-005",
                    Email = "ethan.hunt@university.edu",
                    Phone = "555-0105",
                    Gender = "Male",
                    Address = "654 Cedar Blvd, Gotham"
                }
            );
            context.SaveChanges();
        }

        // Seed Librarians
        if (!context.Librarians.Any())
        {
            context.Librarians.AddRange(
                new Librarian
                {
                    Name = "Sarah Connor",
                    Age = 42,
                    Phone = "555-0201"
                },
                new Librarian
                {
                    Name = "Michael Scott",
                    Age = 48,
                    Phone = "555-0202"
                },
                new Librarian
                {
                    Name = "Ellen Ripley",
                    Age = 35,
                    Phone = "555-0203"
                }
            );
            context.SaveChanges();
        }

        // Seed Publications
        if (!context.Publications.Any())
        {
            context.Publications.AddRange(
                new Publication
                {
                    Title = "The Daily Times",
                    Publisher = "Times Media Group",
                    PublishedDate = new DateTime(2025, 1, 15),
                    Type = PublicationType.Newspaper,
                    IsAvailable = true
                },
                new Publication
                {
                    Title = "The Morning Herald",
                    Publisher = "Herald Publishing",
                    PublishedDate = new DateTime(2025, 3, 10),
                    Type = PublicationType.Newspaper,
                    IsAvailable = true
                },
                new Publication
                {
                    Title = "National Geographic",
                    Publisher = "National Geographic Society",
                    PublishedDate = new DateTime(2025, 6, 1),
                    Type = PublicationType.Magazine,
                    IsAvailable = true
                },
                new Publication
                {
                    Title = "Forbes Business",
                    Publisher = "Forbes Media LLC",
                    PublishedDate = new DateTime(2025, 5, 20),
                    Type = PublicationType.Magazine,
                    IsAvailable = true
                },
                new Publication
                {
                    Title = "Scientific American",
                    Publisher = "Springer Nature",
                    PublishedDate = new DateTime(2025, 4, 1),
                    Type = PublicationType.Magazine,
                    IsAvailable = true
                }
            );
            context.SaveChanges();
        }
    }
}
