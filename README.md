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
  <img src="https://img.shields.io/badge/Gemini_AI-Integrated-4285F4?style=for-the-badge&logo=google&logoColor=white" />
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

> Full CRUD on physical books with title/author/ISBN search, availability badges (Available / Out of Stock), and inline Borrow actions.

---

### 🔄 Borrow Records

![Borrow Records](./Assets/BorrowRecords.png)

> Track active circulation loans with borrower details, borrow/return dates, and one-click **Mark Returned** action.

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

> JWT-based authentication powered by **ASP.NET Core Identity**. Sends credentials to the API and attaches a Bearer token to all subsequent requests.

---

### ℹ️ About & Contact

| About Us | Contact & Support Desk |
|:--------:|:----------------------:|
| ![About](./Assets/AboutUs-1.png) | ![Contact](./Assets/ContactUs.png) |

---

## ✨ Features

| Module | Capabilities |
|--------|-------------|
| **📚 Book Catalog** | Add, edit, delete, search books by title/author/ISBN. Real-time availability tracking. |
| **🔄 Circulation** | Issue books to students, track active loans, record return timestamps, auto-update stock. |
| **👨‍🎓 Students** | Register student members with contact & campus address profiles. |
| **👨‍💼 Librarians** | Manage staff directory with full CRUD. |
| **📰 Publications** | Catalog newspapers & magazines with publisher and availability data. |
| **📊 Analytics** | Real-time dashboard: availability %, loan clearance rate, genre distribution, staff overview. |
| **🔐 Authentication** | ASP.NET Core Identity + JWT Bearer token auth with account registration. |
| **🤖 AI Assistant** | Google Gemini AI integration for catalog recommendations and natural language queries. |
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
                         │  HTTP REST (JWT Bearer)
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
│  Books · BorrowRecords · Students · Librarians         │
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
| JWT Bearer Auth | — | Stateless token-based security |
| Microsoft SQL Server | 2019+ | Relational database engine |
| Google GenAI SDK | — | Gemini AI assistant integration |
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

## 🚀 Getting Started

### Prerequisites

- [.NET SDK 10.0+](https://dotnet.microsoft.com/download)
- [Node.js 20.0+](https://nodejs.org/)
- [SQL Server 2019+](https://www.microsoft.com/en-us/sql-server/) (or Docker)

---

### 1. Database Setup

```bash
cd Library-Management-System

# Update the connection string in appsettings.json if needed:
# "DefaultConnection": "Server=localhost;Database=LMS_Db;Trusted_Connection=True;..."

dotnet ef database update
```

---

### 2. Run the Backend API

```bash
cd Library-Management-System

dotnet build
dotnet run
```

> API will be available at **`http://localhost:5199`**
> Swagger UI: **`http://localhost:5199/swagger`**

---

### 3. Run the Frontend

```bash
cd LMS-Frontend

npm install
npm run dev
```

> App will be served at **`http://localhost:3000`**

---

### Default Login

Use the **Create Account** option in the authentication modal to register a librarian account, then sign in with those credentials.

---

## 🔌 API Overview

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/login` | Authenticate and receive JWT token |
| `POST` | `/api/auth/register` | Register a new librarian account |
| `GET` | `/api/books` | List all books (paginated, searchable) |
| `POST` | `/api/books` | Add a new book |
| `PUT` | `/api/books/{id}` | Update book details |
| `DELETE` | `/api/books/{id}` | Delete a book |
| `GET` | `/api/borrow` | List all borrow records |
| `POST` | `/api/borrow` | Create a new borrow record |
| `PUT` | `/api/borrow/{id}/return` | Mark a book as returned |
| `GET` | `/api/students` | List all registered students |
| `POST` | `/api/students` | Register a new student |
| `GET` | `/api/librarians` | List all librarian staff |
| `GET` | `/api/publications` | List publications (newspapers & magazines) |
| `GET` | `/api/dashboard` | Fetch real-time analytics metrics |
| `POST` | `/api/contact` | Submit a support inquiry |

> Full interactive API documentation: **`http://localhost:5199/swagger`**

---

## 🧪 Running Tests

```bash
cd Library-Management-System.Tests

dotnet test
```

### Test Coverage

| Test Suite | Service Under Test | Cases |
|------------|--------------------|-------|
| `BookServiceTests.cs` | `BookService` | Pagination, Create, Delete (not found) |
| `BorrowServiceTests.cs` | `BorrowService` | Borrow (available), Borrow (already borrowed), Return |
| `DashboardServiceTests.cs` | `DashboardService` | Metric aggregation accuracy |

---

## 📄 Documentation

Full **IEEE Std 830-1998 (SRS)** & **IEEE Std 1016-2009 (SDD)** documentation:

> [`IEEE_Project_Documentation_LMS.md`](./IEEE_Project_Documentation_LMS.md)

Covers: Functional requirements, system architecture, ERD, DFDs, UML sequence diagrams, non-functional requirements, security design, and deployment manual.

---

## 🔒 Security

- **JWT Bearer Authentication** — All API routes are protected; token attached to every request from the frontend.
- **ASP.NET Core Identity** — Secure password hashing and user management.
- **CORS Controls** — Strict origin matching to prevent unauthorized cross-origin requests.
- **XSS Protection** — React automatically escapes all rendered JSX strings.

---

## 📜 License

This project is intended for academic and educational purposes.

---

<p align="center">
  Built with ❤️ using ASP.NET Core 10 · React 19 · SQL Server · Google Gemini AI
</p>
