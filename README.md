<h1 align="center">
  📚 Library Management System
</h1>

<p align="center">
  A full-stack, enterprise-grade web application for managing library catalogs, circulation, student members, librarian staff, periodical publications, and real-time analytics — built with <strong>ASP.NET Core 10</strong> and <strong>React 19</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/.NET-10.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/SQL_Server-2019+-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/xUnit-Tested-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" />
</p>

---

## 📸 Screenshots

### 🏠 Dashboard & Home

| Hero Banner | System Metrics & Recent Activity |
|:-----------:|:--------------------------------:|
| ![Home Page Hero](./Assets/HomePage-1.png) | ![Home Metrics](./Assets/HomePage-2.png) |

---

### 📖 Books Catalog

![Books Catalog](./Assets/Books.png)

> Title metadata, physical-copy inventory, availability counts, and inline Borrow actions.

---

### 🔄 Borrow Records

![Borrow Records](./Assets/BorrowRecords.png)

> Track current and historical student loans by physical copy, with due dates and one-click **Mark Returned** action.

---

### 👨‍🎓 Students Directory

![Students Directory](./Assets/Students.png)

> Register and manage student borrower accounts including contact details, gender, and campus address.

---

### 👨‍💼 Librarians Staff Roster

![Librarians](./Assets/Librarians.png)

> Administer library staff with ID, name, age, and contact records.

---

### 📰 Publications Directory

| Newspapers | Magazines |
|:----------:|:---------:|
| ![Newspapers](./Assets/PublicationNewspaper.png) | ![Magazines](./Assets/PublicationMagazine.png) |

> Manage Newspapers and Magazines in a tabbed directory with publisher, release date, and availability status.

---

### 📊 Analytics & Reports

![Analytics & Reports](./Assets/Reports.png)

> Real-time metrics: Catalog Availability %, Loan Clearance Rate, Active Circulation, Genre & Collection distribution, and Staff overview.

---

### 🔐 Authentication

![Login](./Assets/Login.png)

> ASP.NET Core Identity issues bearer tokens. API authorization rules are planned for Batch 2; a token is currently not required by the controllers.

---

### ℹ️ About & Contact

| About Us | Contact & Support Desk |
|:--------:|:----------------------:|
| ![About](./Assets/AboutUs-1.png) | ![Contact](./Assets/ContactUs.png) |

---

## ✨ Features

| Module | Capabilities |
|--------|-------------|
| **📚 Book Catalog** | Add, edit, delete, search titles; manage physical copies and availability counts. |
| **🔄 Circulation** | Issue specific copies to registered students, track due dates and loan history; availability is calculated from active loans. |
| **👨‍🎓 Students** | Register student members with contact & campus address profiles. |
| **👨‍💼 Librarians** | Manage staff directory with full CRUD. |
| **📰 Publications** | Catalog newspapers & magazines with publisher and availability data. |
| **📊 Analytics** | Real-time dashboard: availability %, loan clearance rate, genre distribution, staff overview. |
| **🔐 Authentication** | ASP.NET Core Identity bearer tokens and account registration; server-side authorization is pending Batch 2. |
| **🤖 AI Assistant** | Gemini support is listed in the project dependencies; no assistant endpoint is present in this checkout. |
| **📬 Contact** | Support inquiry form that submits directly to `POST /api/contact`. |

---

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────────┐
│                   React 19 SPA Frontend                │
│         TypeScript · Vite · TailwindCSS v4             │
│              Framer Motion · Lucide Icons              │
│            Running on http://localhost:3000             │
└────────────────────────┬──────────────────────────────┘
                         │  HTTP REST (bearer tokens supported)
                         ▼
┌───────────────────────────────────────────────────────┐
│              ASP.NET Core 10 Web API                   │
│    Controllers → Services (Interface) → EF Core        │
│         Running on http://localhost:5199               │
│         Swagger UI: http://localhost:5199/swagger      │
└────────────────────────┬──────────────────────────────┘
                         │  Entity Framework Core 10
                         ▼
┌───────────────────────────────────────────────────────┐
│          Microsoft SQL Server (LMS_Db)                 │
│  Books · BookCopies · BorrowRecords · Students · Librarians         │
│  Publications (Newspapers & Magazines) · Users         │
└───────────────────────────────────────────────────────┘
```

### N-Tier Layer Breakdown

```
Controllers/         → API endpoints (REST routes)
Services/            → Business logic (IBookService, IBorrowService, etc.)
Models/              → EF Core entity definitions
DTOs/                → Request/Response transfer objects
Data/                → DbContext (AppDbContext + Identity)
Migrations/          → EF Core schema migrations
```

---

## 🛠️ Tech Stack

### Backend — `Library-Management-System/`

| Technology | Version | Role |
|------------|---------|------|
| ASP.NET Core Web API | 10.0 | REST API framework |
| Entity Framework Core | 10.0 | ORM + DB migrations |
| ASP.NET Core Identity | 10.0 | User auth & password hashing |
| Identity Bearer Tokens | — | Token issuance; route authorization is pending Batch 2 |
| Microsoft SQL Server | 2019+ | Relational database engine |
| Google GenAI SDK | — | Existing frontend dependency; assistant feature is not wired in this checkout |
| xUnit + Moq + EF InMemory | — | Unit testing framework |

### Frontend — `LMS-Frontend/`

| Technology | Version | Role |
|------------|---------|------|
| React | 19 | UI component library |
| TypeScript | 5.8 | Type-safe JavaScript |
| Vite | 6 | Build tool & dev server |
| TailwindCSS | v4 | Utility-first CSS framework |
| Framer Motion | — | Animations & transitions |
| Lucide React | — | Icon library |

---

## 📁 Project Structure

```
LMS/
├── Library-Management-System/        # ASP.NET Core 10 Web API (Backend)
│   ├── Controllers/                  # API route handlers
│   ├── Services/                     # Business logic interfaces & implementations
│   ├── Models/                       # EF Core entity models
│   ├── DTOs/                         # Data Transfer Objects
│   ├── Data/                         # DbContext & Identity configuration
│   ├── Migrations/                   # EF Core database migrations
│   ├── Program.cs                    # App startup, DI registration, middleware
│   └── appsettings.json              # DB connection string & config
│
├── Library-Management-System.Tests/  # xUnit test project
│   ├── BookServiceTests.cs
│   ├── BorrowServiceTests.cs
│   └── DashboardServiceTests.cs
│
├── LMS-Frontend/                     # React 19 + TypeScript SPA (Frontend)
│   ├── src/
│   │   ├── components/views/         # Page-level view components
│   │   ├── components/ui/            # Reusable UI components
│   │   └── ...
│   └── vite.config.ts
│
├── Assets/                           # Project screenshots
├── LMSSQLServerData/                 # SQL Server data volume
└── IEEE_Project_Documentation_LMS.md # IEEE SRS & SDD documentation
```

---

## 🚀 Getting Started (fresh database)

Install the .NET 10 SDK, Node.js, npm, and a SQL Server instance. The backend uses EF Core SQL Server 10.0.10. No database is created or migrated automatically at startup.

```bash
cd Library-Management-System
dotnet restore
dotnet tool install --global dotnet-ef --version 10.0.10
```

Set `ConnectionStrings:DefaultConnection` outside tracked files. For local Windows or SQL Server installations using integrated authentication, this is a safe example:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=Granthalaya;Trusted_Connection=True;TrustServerCertificate=True"
dotnet ef database update
dotnet run
```

On a host that uses SQL authentication, use .NET user secrets in development or `ConnectionStrings__DefaultConnection` as an environment variable in deployment. Do not put passwords in `appsettings.json`. See `Library-Management-System/appsettings.example.json` for configuration keys; it is a template, not loaded automatically.

Development CORS origins are explicitly listed in `appsettings.Development.json` for `http://localhost:3000` and `http://localhost:5173`. Set production origins with `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, etc. If none are configured, cross-origin browser requests are denied. Swagger UI is available only in Development.

Sample books, copies, students, librarians, and publications are optional. After `dotnet ef database update`, enable them only in Development with `SeedData__Enabled=true`. Repeated runs do not duplicate the sample rows.

```bash
cd LMS-Frontend
npm ci
npm run dev
```

The frontend defaults to `http://localhost:5199` and can be pointed to another API URL in Settings. Run backend tests with `dotnet test Library-Management-System.Tests/Library-Management-System.Tests.csproj` from the repository root; run frontend checks with `npm run lint` and `npm run build` in `LMS-Frontend`. Relational concurrency and foreign-key tests skip unless `GRANTHALAYA_TEST_SQL_CONNECTION` points to an isolated SQL Server instance with permission to create databases. Each such test creates and removes only its own uniquely named `Granthalaya_Test_*` database.

### Current API routes

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/books` | List/create titles |
| GET/PUT/DELETE | `/api/books/{id}` | Read/update/delete title metadata |
| POST | `/api/books/{bookId}/copies` | Add a physical copy |
| GET | `/api/books/{bookId}/copies/{copyId}` | Read a physical copy and its current availability |
| PUT/DELETE | `/api/books/{bookId}/copies/{copyId}` | Update or delete a copy without history |
| GET/POST | `/api/students` | List/register students |
| GET/PUT/DELETE | `/api/students/{id}` | Read/update/delete a student without history |
| POST | `/api/borrow` | Borrow a specific copy for a registered student |
| POST | `/api/borrow/return/{borrowRecordId}` | Return an active loan |
| GET | `/api/borrow/records` | Current and historical loans |

Borrow requests contain `studentId`, `bookCopyId`, and a future UTC `dueDate`. Loan history is never deleted through the API. Book and student deletion returns 409 when borrowing history exists. Librarian, publication, dashboard, contact, and Identity endpoints remain available.

---

## 📄 Documentation

Full **IEEE Std 830-1998 (SRS)** & **IEEE Std 1016-2009 (SDD)** documentation:

> [`IEEE_Project_Documentation_LMS.md`](./IEEE_Project_Documentation_LMS.md)

Covers: Functional requirements, system architecture, ERD, DFDs, UML sequence diagrams, non-functional requirements, security design, and deployment manual.

---

## 🔒 Security status

The SQL Server credential formerly tracked in `appsettings.json` must be rotated wherever it was used. The prefilled frontend login password must also be rotated if it corresponded to a real account. Removing these values from current files does not remove them from Git history.

The current API controllers have no server-side authorization requirement. This includes book/copy, student, librarian, publication, and circulation writes, plus borrower and contact-message reads. Identity registration is public. Frontend login checks are not access control. Authentication and role-based authorization are planned for Batch 2; do not expose this deployment to untrusted users before that work.

---

## 📜 License

This project is intended for academic and educational purposes.

---

<p align="center">
  Built with ❤️ using ASP.NET Core 10 · React 19 · SQL Server
</p>
