 
# 🍴 CityBite — Food Discovery & Restaurant Rating Platform

<div align="center">

### Discover Food. Explore Restaurants. Share Your Experience.

**A modern full-stack food discovery and restaurant rating platform built to help users discover popular dishes, explore restaurants, and submit bill-verified food reviews.**

[![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build_Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-Backend-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-Database-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)

**Developed by Engineer Sayyam Shahid**

[Explore Repository](https://github.com/engineersayyamshahid/citybite-food-discovery-platform) · [Report an Issue](https://github.com/engineersayyamshahid/citybite-food-discovery-platform/issues)

</div>

---

## 🧡 About CityBite

CityBite is a full-stack **Food Discovery, Restaurant Ranking, and Rating & Review Platform** developed as a university Final Year Project (FYP).

It provides an interactive platform where customers can discover restaurants, explore food items, compare ratings, and share their dining experiences through verified reviews.

Unlike traditional food delivery applications, CityBite focuses on food discovery, restaurant reputation, and authentic customer feedback.

### ✨ Our Vision

*Discover the best food around you, explore trusted restaurants, and let real customer experiences guide your next meal.*

> **CityBite is not a food delivery application.** It focuses on food discovery, restaurant rankings, customer ratings, and bill-verified reviews. It does not include shopping carts, checkout, or delivery tracking.

---

## 🎬 Project Preview

<div align="center">

<!-- Add your animated project demonstration GIF here -->

<!-- ![CityBite Demo](frontend/src/assets/images/citybite-demo.gif) -->

**CityBite — A modern food discovery experience**

</div>

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| 🍔 Food Discovery | Discover popular dishes and food categories. |
| 🏪 Restaurant Discovery | Explore restaurants, locations, and ratings. |
| ⭐ Restaurant Ranking | Discover restaurants based on customer ratings. |
| 📝 Food Reviews | Submit ratings and share dining experiences. |
| 🎫 Bill Verification | Demonstrate review verification using a unique 6-character bill code. |
| ❤️ Favorites | Save favorite foods and restaurants. |
| 👤 User Profiles | Manage profile information and personal reviews. |
| 🔐 Authentication | Customer and restaurant authentication workflows. |
| 🏷️ Restaurant Management | Manage restaurant information, menus, and food availability. |
| 🧾 Bill Generation | Restaurants can generate bills with unique review codes. |
| 📢 Promotions | Restaurant promotion and advertising management. |
| 📱 Responsive UI | Optimized layouts for desktop, tablets, and mobile devices. |

---

## 🎨 Design & User Experience

CityBite uses a modern food-focused visual identity inspired by the supplied project mockups.

**Brand color direction:**

| Color | Purpose |
|---|---|
| 🟠 Orange | Primary brand color and interactive elements |
| 🟡 Cream | Soft backgrounds and visual sections |
| ⚪ White | Cards, content surfaces, and clean layouts |
| ⚫ Dark | Text, navigation, and contrast |

### UI/UX Highlights

- Smooth animations and transitions.
- Interactive restaurant and food cards.
- Attractive hover effects.
- Responsive navigation.
- Modern buttons and forms.
- Animated loading and feedback states.
- Mobile-friendly navigation.
- Consistent typography and spacing.

---

## 🛠️ Technology Stack

### Frontend

- React.js
- Vite
- JavaScript (ES6+)
- HTML5
- CSS3
- React Router DOM
- Lucide React
- React Context API
- Local API integration

### Backend

- ASP.NET Core 10 Web API
- C#
- Entity Framework Core
- RESTful API architecture
- JWT Authentication
- DTO-based communication

### Database

- Microsoft SQL Server
- SQL Server Express
- Relational database design
- SQL schema and seed scripts

### Development Tools

- Visual Studio Code
- Visual Studio
- Git & GitHub
- SQL Server Management Studio
- Postman / Swagger

---

## 🏗️ System Architecture

CityBite follows a three-layer architecture:

```text
          CITYBITE APPLICATION
                   |
          React + Vite Frontend
          localhost:5173
                   |
              HTTP / JSON
             JWT Authorization
                   |
          ASP.NET Core 10 API
          localhost:5000
                   |
           Entity Framework Core
                   |
            SQL Server Database
              CityBite
```

### How It Works

1. Users interact with the React frontend.
2. The frontend sends HTTP requests to the ASP.NET Core API.
3. The backend validates requests and processes business logic.
4. Entity Framework Core communicates with SQL Server.
5. Database results are returned through the API.
6. The frontend displays the updated information.

Restaurant and food images are served through the backend uploads directory.

---

## 📂 Project Structure

```text
CityBite-Fullstack/
│
├── backend/
│   ├── Database/
│   │   ├── 01_Schema.sql
│   │   └── 02_Seed_Lookups.sql
│   │
│   └── CityBite.Api/
│       ├── Controllers/
│       ├── Services/
│       ├── DTOs/
│       ├── Models/
│       ├── Data/
│       ├── wwwroot/
│       │   └── uploads/
│       ├── Program.cs
│       └── appsettings.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   ├── .env
│   └── package.json
│
├── scripts/
│   ├── 1-setup-database.bat
│   ├── 2-seed-demo-data.bat
│   ├── 3-run-all.bat
│   ├── run-backend-only.bat
│   └── run-frontend-only.bat
│
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

Install the following tools before running CityBite:

| Software | Requirement |
|---|---|
| Node.js | Version 18+ |
| npm | Included with Node.js |
| .NET SDK | .NET 10 |
| SQL Server Express | Required |
| SQL Server Management Studio | Optional |
| Git | Recommended |

### 1. Clone the Repository

```bash
git clone https://github.com/engineersayyamshahid/citybite-food-discovery-platform.git

cd citybite-food-discovery-platform
```

### 2. Configure the Database

The default SQL Server connection is:

```text
Server=.\SQLEXPRESS;
Database=CityBite;
Trusted_Connection=True;
TrustServerCertificate=True
```

Open PowerShell or Command Prompt:

```bash
cd backend

sqlcmd -S ".\SQLEXPRESS" -E -C -Q "CREATE DATABASE CityBite"

sqlcmd -S ".\SQLEXPRESS" -E -C -I -d CityBite -i Database/01_Schema.sql

sqlcmd -S ".\SQLEXPRESS" -E -C -I -d CityBite -i Database/02_Seed_Lookups.sql
```

**Important:** Keep the `-I` option when executing the SQL scripts to avoid the `QUOTED_IDENTIFIER` error.

### 3. Seed Demo Data

```bash
cd CityBite.Api

dotnet run -- --seed-demo
```

### 4. Configure the Frontend

Create or update `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Restart the frontend after changing environment variables.

### 5. Start the Backend

```bash
cd backend/CityBite.Api

dotnet run --launch-profile http
```

Backend:

http://localhost:5000

Swagger:

http://localhost:5000/swagger

### 6. Start the Frontend

Open another terminal:

```bash
cd frontend

npm install

npm run dev
```

Frontend:

http://localhost:5173

---

## ⚡ Quick Setup Using Windows Scripts

For easier development, CityBite includes Windows batch scripts.

Navigate to the `scripts` directory.

Execute these scripts in order:

| Script | Purpose |
|---|---|
| `1-setup-database.bat` | Creates database and tables. |
| `2-seed-demo-data.bat` | Inserts demonstration data. |
| `3-run-all.bat` | Starts frontend and backend. |
| `run-backend-only.bat` | Starts only the backend. |
| `run-frontend-only.bat` | Starts only the frontend. |

After successful setup, open:

**http://localhost:5173**

---

## 👨‍💻 Demo Accounts

All demo accounts use the following password:

```text
secret123
```

| Account | Login | Role |
|---|---|---|
| Sana Tariq | `03001234567` | Customer |
| Tabaq Kitchen | `03007654321` | Restaurant |
| Spice Villa | `03007654322` | Restaurant |
| BBQ House | `03007654323` | Restaurant |
| Milano's | `03007654324` | Restaurant |
| Fast Bites | `03007654325` | Restaurant |
| Sweet House | `03007654326` | Restaurant |
| Desi Dhaba | `03007654327` | Restaurant |
| Dragon Wok | `03007654328` | Restaurant |

Customer email:

```text
sana.tariq@citybite.demo
```

### Review Verification Demo

Use these demonstration review codes:

| Bill | Review Code |
|---|---|
| #10432 | `K7M4QX` |
| #10444 | `H4P9ZD` |

**OTP:** In offline demonstration mode, the OTP is displayed on the screen.

---

## ⭐ Bill-Verified Review Workflow

One of CityBite's key features is its bill-based review verification system.

The workflow:

1. A restaurant logs into its account.
2. Opens the Bill section.
3. Selects food items and generates a customer bill.
4. The system generates a unique 6-character review code.
5. A customer logs into CityBite.
6. Opens the review submission section.
7. Enters the code printed on the bill.
8. The backend validates the code.
9. The customer rates eligible dishes and submits feedback.
10. Restaurant and food ratings are updated.

### Review Rules

- A bill code is valid for 7 days.
- A bill code can be used by up to 4 people.
- Each person can rate a dish only once per bill code.

These rules are enforced by the backend.

---

## 🔌 API & Frontend Integration

The frontend communicates with the backend through:

```text
frontend/src/services/apiClient.js
```

This central API client handles:

- HTTP requests.
- JWT authorization headers.
- API error handling.
- Authentication token management.
- Expired session handling.

### Main API Modules

| Module | Purpose |
|---|---|
| Authentication | Login, signup, OTP, password reset |
| Users | Profile and account management |
| Restaurants | Restaurant discovery and details |
| Dishes | Food discovery and details |
| Favorites | Favorite foods and restaurants |
| Reviews | Ratings and bill verification |
| Bills | Restaurant bill generation and history |
| Menu | Restaurant food management |
| Promotions | Restaurant advertising and promotions |
| Areas | Location and area management |
| Health | API and database connectivity |

---

## 🔒 Security & Configuration Notes

CityBite uses JWT authentication for API authorization.

Important configuration files:

| File | Purpose |
|---|---|
| `backend/CityBite.Api/appsettings.json` | Backend settings |
| `frontend/.env` | Frontend API URL |
| `backend/CityBite.Api/Program.cs` | Application configuration |

Before production deployment:

- Replace the development JWT secret.
- Secure database credentials.
- Disable displaying OTPs in API responses.
- Configure HTTPS.
- Implement a real email/SMS verification provider.
- Configure production CORS policies.
- Validate file uploads.
- Use secure environment variables.

**Note:** Demo credentials and offline OTP behavior are intended for local testing only.

---

## 🧪 Testing & Troubleshooting

| Problem | Solution |
|---|---|
| Server not reachable | Start the ASP.NET Core backend. |
| Database not connected | Check SQL Server and connection string. |
| QUOTED_IDENTIFIER error | Execute SQL scripts with `-I`. |
| Port already in use | Change the relevant application port. |
| Images not loading | Check backend uploads and API URL. |
| Login session expired | Log in again. |
| Review code expired | Generate or use a valid bill code. |
| Frontend cannot connect | Verify `VITE_API_URL` and restart Vite. |

### Health Check

Open:

http://localhost:5000/api/health

Expected response when everything is connected:

```json
{
  "api": "running",
  "database": "connected"
}
```

---

## 📈 Future Development

CityBite has been designed with an extensible architecture.

Potential future improvements include:

- Advanced restaurant analytics.
- Administrator dashboard.
- Real-time notifications.
- Advanced recommendation engine.
- Improved restaurant ranking algorithms.
- Production email/SMS verification.
- Secure deployment and cloud hosting.
- Advanced reporting and analytics.
- Automated testing and CI/CD.

---

## 🎓 University Final Year Project

**Project Name:** CityBite — Food Discovery & Restaurant Rating Platform

**Project Type:** Final Year Project (FYP)

**Development Scope:** Full-stack web application

**Frontend:** React.js + Vite

**Backend:** ASP.NET Core 10 Web API

**Database:** Microsoft SQL Server

---

## 👨‍💻 Developer

<div align="center">

### Engineer Sayyam Shahid

**Full Stack Developer | AI Automation Enthusiast | Software Engineer**

Building modern web applications, scalable software solutions, and AI-powered digital experiences.

[![GitHub](https://img.shields.io/badge/GitHub-engineersayyamshahid-181717?style=for-the-badge&logo=github)](https://github.com/engineersayyamshahid)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sayyam_Shahid-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/sayyam-shahid-939bb135a/)

[![Portfolio](https://img.shields.io/badge/Company-SYFA_Digital-2563EB?style=for-the-badge)](https://syfadigital.com)

---

### 🧡 CityBite

**Discover More. Taste Better. Rate Honestly.**

Made with dedication by **Engineer Sayyam Shahid**.

</div>
