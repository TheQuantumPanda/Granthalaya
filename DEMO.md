# Granthalaya demo script (about 3 minutes)

This is a recording plan. No video has been recorded by this batch. Use neutral local demonstration records and never display terminal secrets, bearer tokens, or password entry.

| Time | Screen and narration |
|---|---|
| 0:00–0:25 | Dashboard: “Granthalaya is a local-only library-management system built with React 19, TypeScript, ASP.NET Core 10, EF Core, and SQL Server. These counts distinguish titles from physical copies and active from returned loans.” |
| 0:25–0:55 | Books: search a title and open its physical copies. Explain unique accession numbers, physical status, and availability derived from active loans. |
| 0:55–1:25 | Students: register a neutral demonstration borrower with a unique registration number. Show required fields and email validation. |
| 1:25–2:00 | Borrow Records: choose the student, available copy, and due date. Show the active loan and changed inventory; mark it returned and show preserved history. |
| 2:00–2:20 | Explain that SQL Server's filtered unique index permits only one active loan per physical copy, including concurrent requests. Briefly show overdue/history filters and pagination. |
| 2:20–2:40 | Switch to a Librarian session: catalog/circulation are available, while Admin staff controls are hidden. Return to Admin staff accounts to explain controlled provisioning and revocation. Omit password-entry footage. |
| 2:40–3:00 | Show the final backend and Playwright test summaries. Conclude with local reproducibility, SQL constraints, and the documented architecture. |

Use [LOCAL_SETUP.md](docs/LOCAL_SETUP.md) for startup. Use a disposable dataset for a recording, then capture only reviewed application screens. The automated screenshot flag recreates portfolio images without touching the persistent development database.

## Resume bullet options

- Built a local full-stack library-management application using ASP.NET Core 10, EF Core, SQL Server, React 19, and TypeScript, separating title metadata from accession-numbered physical inventory.
- Implemented Identity bearer authentication, Admin/Librarian authorization, immediate session revocation, and SQL Server constraints that prevent concurrent active loans and preserve circulation history.
- Verified library workflows with SQL Server integration coverage and five Playwright journeys against disposable databases; documented reproducible Linux setup, architecture, and real application screenshots.
