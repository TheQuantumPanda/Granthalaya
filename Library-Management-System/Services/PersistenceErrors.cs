using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Library_Management_System.Services;

public static class PersistenceErrors
{
    public static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is SqlException sql && sql.Number is 2601 or 2627;

    public static bool IsForeignKeyViolation(DbUpdateException exception) =>
        exception.InnerException is SqlException sql && sql.Number == 547;
}
