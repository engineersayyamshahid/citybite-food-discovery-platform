# 🍴 CityBite — Full-stack project (React website + ASP.NET Core API + SQL Server)

Food discovery, restaurant ranking and **bill-verified reviews**.
Customers find top-rated dishes and restaurants, eat at the restaurant, then rate the dishes with the **6-character code printed on their bill**.
Restaurants manage their menu, create bills, see reviews and promote themselves.

> CityBite is **not** a food-delivery app — there is no cart, checkout or delivery.

This folder contains **everything in one place**:

```
CityBite-Fullstack/
├─ backend/     ASP.NET Core 10 Web API  +  SQL Server database scripts   (your backend, unchanged)
├─ frontend/    React + Vite website  — now connected to the backend       (design unchanged)
├─ scripts/     double-click helpers (.bat) to set up and run everything on Windows
└─ README.md    this file
```

---

## 1. How the three parts connect

```
┌──────────────────────┐   HTTP + JSON     ┌──────────────────────┐   Entity Framework   ┌─────────────────────┐
│  React website       │  (JWT token in    │  ASP.NET Core API    │ ───────────────────▶ │  SQL Server Express │
│  http://localhost:5173│  Authorization)   │  http://localhost:5000│                      │  database "CityBite"│
│  frontend/           │ ────────────────▶ │  backend/CityBite.Api │ ◀─────────────────── │  backend/Database/  │
└──────────────────────┘ ◀──────────────── └──────────────────────┘                      └─────────────────────┘
                              photos: http://localhost:5000/uploads/...   (stored in backend/CityBite.Api/wwwroot/uploads)
```

* The **frontend never keeps its own data** any more (the old LocalStorage demo data is gone). Every list, rating, favourite, bill, review and menu item is read from / saved to the database through the API.
* Only the login **token** and the **recent searches** are kept in the browser.
* Prices, totals, ratings, rankings, review-code rules (7 days, 4 people, one rating per dish) are all decided by the **backend**, so they can't be faked from the browser.

---

## 2. What you need installed (Windows)

| Tool | Why | Check |
|---|---|---|
| **.NET 10 SDK** | runs the backend | `dotnet --list-sdks` |
| **SQL Server Express** (instance `.\SQLEXPRESS`) | the database | open SSMS or run `sqlcmd -?` |
| **SSMS** (optional) | to look at the tables | – |
| **Node.js 18+** (includes npm) | runs the React website | `node -v` |

---

## 3. First-time setup (5 steps)

### Option A — with the helper scripts (easiest)
Double-click in this order (inside the `scripts` folder):

1. `1-setup-database.bat` → creates the `CityBite` database, tables, areas, cuisines, food types, promotion packages
2. `2-seed-demo-data.bat` → adds demo restaurants, dishes, reviews, bills and users
3. `3-run-all.bat` → starts the backend **and** the website in two windows

Then open **http://localhost:5173**.

### Option B — by hand

```bash
# 1) database (once)
cd backend
sqlcmd -S ".\SQLEXPRESS" -E -C -Q "CREATE DATABASE CityBite"
sqlcmd -S ".\SQLEXPRESS" -E -C -I -d CityBite -i Database/01_Schema.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -I -d CityBite -i Database/02_Seed_Lookups.sql
#   (always keep -I, otherwise you get a QUOTED_IDENTIFIER error)

# 2) demo data (once)
cd CityBite.Api
dotnet run -- --seed-demo

# 3) start the backend   -> http://localhost:5000
dotnet run --launch-profile http

# 4) in a SECOND terminal: start the website   -> http://localhost:5173
cd frontend
npm install        # first time only
npm run dev
```

### Check that everything is connected
| Check | Open | You should see |
|---|---|---|
| Backend + database | http://localhost:5000/api/health | `{"api":"running","database":"connected"}` |
| Try every API | http://localhost:5000/swagger | list of endpoints |
| The website | http://localhost:5173 | CityBite landing page with real restaurants |

If the website shows **"Server not reachable"**, the backend isn't running or `VITE_API_URL` is wrong (see Troubleshooting).

---

## 4. Settings you may need to change

| What | Where | Default |
|---|---|---|
| Database connection | `backend/CityBite.Api/appsettings.json` → `ConnectionStrings:CityBiteDb` | `Server=.\SQLEXPRESS;Database=CityBite;Trusted_Connection=True;TrustServerCertificate=True` |
| Backend address used by the website | `frontend/.env` → `VITE_API_URL` | `http://localhost:5000` |
| OTP in the response (offline demo) | `backend/CityBite.Api/appsettings.json` → `Otp:ShowInResponse` | `true` (the 4-digit code is shown on screen, no SMS needed) |
| JWT secret key | `backend/CityBite.Api/appsettings.json` → `Jwt:Key` | change it before any real deployment |

After changing `frontend/.env`, stop and start `npm run dev` again.

**Open the site from a phone or another laptop on the same Wi-Fi:** put the laptop's IP in `frontend/.env`
(`VITE_API_URL=http://192.168.x.x:5000`, find it with `ipconfig`), restart `npm run dev`, then open `http://192.168.x.x:5173` on the other device. Allow *Private networks* in Windows Firewall when asked.

---

## 5. Demo accounts

All passwords: **`secret123`**

| Who | Login | Tab on the login screen |
|---|---|---|
| Sana Tariq (customer, has favourites + taste picks) | `03001234567` or `sana.tariq@citybite.demo` | **Customer** |
| Tabaq Kitchen | `03007654321` | **Restaurant** |
| Spice Villa / BBQ House / Milano's / Fast Bites / Sweet House / Desi Dhaba / Dragon Wok | `03007654322` … `03007654328` | **Restaurant** |

**Review codes to test:** `K7M4QX` (bill #10432) and `H4P9ZD` (bill #10444) — Tabaq Kitchen.
**OTP code** on sign-up / forgot password: shown on screen in the yellow box (offline demo mode).

### Try the main story (2 minutes)
1. Log in as **Tabaq Kitchen** (Restaurant tab) → **Bill** tab → type a table number, add dishes → **Generate bill** → note the 6-character code.
2. Log out → log in as **Sana** (Customer tab) → **Reviews** → **Add review** → type the code → **Find bill** → **Rate these dishes**.
3. Give stars, add a photo and a comment → **Submit review**.
4. Open the dish: its rating, review count and ranking have changed. The same code can be used by up to 4 people, but each person can rate a dish only once.

---

## 6. Which screen uses which API

| Screen (route) | Backend endpoints used |
|---|---|
| Landing `/` | `GET /api/restaurants`, `GET /api/dishes`, `GET /api/cuisines` |
| Login `/login` | `POST /api/auth/login` |
| Sign up `/signup` | `POST /api/auth/signup/customer`, `POST /api/auth/signup/restaurant`, `GET /api/areas` |
| Verify OTP `/verify-otp` | `POST /api/auth/verify-otp`, `POST /api/auth/resend-otp` |
| Forgot password `/forgot-password` | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Location / area `/onboarding/*` | `GET /api/areas`, `PUT /api/me/area` |
| Taste picker `/onboarding/taste` | `GET /api/cuisines`, `GET` + `PUT /api/me/taste` |
| Home `/home` | `GET /api/home?foodTypeId=` (also counts sponsored views) |
| Explore `/explore` | `GET /api/cuisines`, `GET /api/home`, `GET /api/restaurants` |
| Search `/search`, Results `/results` | `GET /api/dishes`, `GET /api/restaurants` (q, cuisineIds, price, rating, photos, sort, page) |
| Favorites `/favorites` + hearts | `GET /api/me/favorites`, `PUT/DELETE /api/me/favorites/{dishes\|restaurants}/{id}` |
| Restaurant page `/restaurant/:id` | `GET /api/restaurants/{id}` (`?src=sponsored` counts a tap) |
| Dish page `/dish/:id` | `GET /api/dishes/{id}` |
| Dish reviews `/dish/:id/reviews` | `GET /api/dishes/{id}/reviews` |
| My reviews `/reviews` | `GET /api/me/reviews` |
| Add review `/reviews/add` | `POST /api/reviews/redeem` |
| Rate dishes `/reviews/rate/:code` | `POST /api/reviews/redeem`, `POST /api/reviews`, `POST /api/reviews/{id}/photos` |
| Profile `/profile` | `GET/PUT /api/me`, `PUT /api/me/password`, favourites, taste, my reviews |
| **Restaurant:** Generate bill `/r/bill` | `GET /api/my-restaurant/bill-menu`, `POST /api/my-restaurant/bills` |
| Bill / receipt `/r/bill/:id`, history `/r/bills` | `GET /api/my-restaurant/bills/{id}`, `GET /api/my-restaurant/bills` |
| Menu `/r/menu` | `GET …/categories`, `GET …/dishes`, `PATCH …/dishes/{id}/availability`, `DELETE …/dishes/{id}` |
| Add / edit dish `/r/menu/new`, `/r/menu/:id/edit` | `POST/PUT …/dishes`, `POST …/dishes/{id}/photo`, `POST …/categories` |
| Ratings & reviews `/r/reviews` | `GET /api/my-restaurant/reviews` |
| Profile / settings `/r/profile`, `/r/settings` | `GET /api/my-restaurant`, `GET …/opening-hours`, `GET …/promotions` |
| Details `/r/settings/details` | `GET/PUT /api/my-restaurant`, `POST …/cover`, `POST …/logo` |
| Opening hours `/r/settings/hours` | `GET/PUT /api/my-restaurant/opening-hours` |
| Promote `/r/promote`, Promotion `/r/promotion` | `GET /api/promotion-packages`, `POST …/promotions`, `POST …/promotions/{id}/extend`, `POST …/promotions/{id}/stop` |

All calls go through **one file**: `frontend/src/services/apiClient.js` (adds the token, turns errors into readable messages, signs the user out if the token expires).

---

## 7. What changed in the frontend (and why)

The **design is identical** — same colours, fonts, layouts, animations, mobile bottom bar and desktop website layout. Only the data source changed. A few things were adapted so they match what your backend really provides:

| Before (local demo) | Now (real backend) |
|---|---|
| Data from `localStorage` | Data from the API + database |
| Fake login / OTP `4821` | Real JWT login; OTP from the backend (`devOtp` shown on screen in offline mode) |
| Restaurant "distance in km", "Nearest" sort | Not in the backend → area name is shown, "Nearest" sort removed |
| "Helpful" button on reviews | Not in the backend → removed (review sorting works on the loaded reviews) |
| Review list on the restaurant page | Backend has reviews per **dish** → the restaurant page links to each dish's reviews |
| "Use my current location" | Backend uses a list of **areas** → pick the area from the list |
| Edit email / phone in profile | Backend allows editing the **name** and the password only |
| One comment for the whole bill | Same screen; the comment is saved on every rated dish |
| Local sample photos | Photos come from the backend `/uploads/...`; uploads are sent to the API |

**Small additions** (needed by the backend, styled like the rest of the app): *Change password* in the profile, *Bill history* page, a code step on *Forgot password*, *Area + Address* when a restaurant signs up, a *Food type* dropdown when adding a dish (so it can be ranked), tap the **● Available** label on the menu to switch availability, *Load more* buttons on long lists, and an error box with **Try again** when the server can't be reached.

---

## 8. Project structure

```
backend/
├─ Database/                01_Schema.sql, 02_Seed_Lookups.sql
├─ CityBite.Api/
│  ├─ Program.cs            startup: database, JWT, Swagger, CORS, static files
│  ├─ appsettings.json      connection string, JWT, OTP
│  ├─ Controllers/          Auth, Me, Home, Dishes, Restaurants, Areas, Favorites, Reviews,
│  │                        MyRestaurant (Menu, Settings, Bills), Promotions, Health
│  ├─ Services/ DTOs/ Models/ Data/   business rules, JSON shapes, tables, DbContext + demo seeder
│  └─ wwwroot/uploads/      photos
frontend/
├─ .env                     VITE_API_URL
└─ src/                     services/ (API calls), context/, hooks/, pages/, components/, styles/
```

Add a new screen: create `frontend/src/pages/...`, add one `lazy()` import + `<Route>` in `App.jsx`, and call the API through a function in `frontend/src/services/`.

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Website says **"Server not reachable"** | Start the backend (`scripts\run-backend-only.bat`), open http://localhost:5000/api/health. Check `VITE_API_URL` in `frontend/.env` and restart `npm run dev`. |
| `/api/health` says `database: not connected` | SQL Server isn't running, or the connection string is wrong (`appsettings.json`). |
| `QUOTED_IDENTIFIER` error | Run `sqlcmd` with `-I`. |
| Port 5000 or 5173 already in use | Close the other program, or change the port (`backend/CityBite.Api/Properties/launchSettings.json`, `frontend/vite.config.js`). |
| Login works but pictures are empty | You didn't run `2-seed-demo-data.bat`, or the website points to the wrong backend address. |
| Phone can't open the site | Use the laptop IP (section 4) and allow *Private networks* in the firewall. |
| Logged out suddenly | The token expired (30 days) or the database was reset → log in again. |
| "Code is wrong or has expired" | OTP codes last 10 minutes — press *Resend code*. |

Build the website for hosting: `cd frontend && npm run build` → upload the `dist/` folder, and publish the backend with `dotnet publish -c Release` (set `VITE_API_URL` to the public API address *before* building, and use https + a new JWT key).

---

## 10. Honest notes

* The frontend was checked automatically in a browser against a **test server that follows your backend's DTOs** (all screens load on phone and desktop sizes; login, sign-up/OTP, favourites, filters, area/taste, review flow with photo upload, bills, menu add/edit/delete, hours, details, promotions were exercised).
* The **real** .NET backend and SQL Server could not be started where this was assembled (no .NET SDK / SQL Server there), so please run the setup in section 3 once on your laptop and tell me about any screen that behaves differently from your real API.
* The backend code was left **unchanged**.
* OTP is shown on screen because SMS/e-mail can't be sent offline. Payments for promotions are not real — the backend only records the promotion.
