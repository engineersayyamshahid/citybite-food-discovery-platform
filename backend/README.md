# CityBite — Backend (ASP.NET Core Web API + SQL Server)

CityBite is a food discovery and rating app. Customers find the best dishes near them, eat at the restaurant,
and rate the dishes using the **review code printed on their bill**. There is **no ordering in the app**.

This repository is the **one shared backend** for all four apps:

| Member | App | Talks to the backend with |
|---|---|---|
| Android | Kotlin | Retrofit + OkHttp |
| Flutter | Dart | `dio` or `http` |
| React Native | JS/TS | `axios` or `fetch` |
| Web | React | `fetch` (or `axios`) |

```
 Android ─┐
 Flutter ─┤  HTTP + JSON   ┌────────────────────────┐        ┌──────────────────┐
 RN ──────┼──────────────▶ │ CityBite.Api (.NET 10) │ ─────▶ │ SQL Server       │
 React ───┘  (JWT token)   │ http://<laptop>:5000   │  EF    │ .\SQLEXPRESS     │
                           └────────────────────────┘  Core  │ database CityBite│
                                                             └──────────────────┘
```

Apps **never** touch the database. They only call the API. All business rules (bill totals, review codes,
ratings) are calculated **in the backend**, so every app shows the same numbers.

Everything works **offline** (no internet needed) — see [Offline / exam checklist](#11-offline--exam-checklist).

---

## Contents
1. [What you need to install](#1-what-you-need-to-install)
2. [Setup (first time)](#2-setup-first-time)
3. [Run the backend](#3-run-the-backend)
4. [Connect your app to the backend](#4-connect-your-app-to-the-backend)
5. [Demo accounts and codes](#5-demo-accounts-and-codes)
6. [API basics (read this before coding)](#6-api-basics-read-this-before-coding)
7. [Endpoints by screen](#7-endpoints-by-screen)
8. [Main flows step by step](#8-main-flows-step-by-step)
9. [First API call in each technology](#9-first-api-call-in-each-technology)
10. [Project structure and rules](#10-project-structure-and-rules)
11. [Offline / exam checklist](#11-offline--exam-checklist)
12. [Working together with Git](#12-working-together-with-git)

---

## 1. What you need to install

| Tool | Why |
|---|---|
| **.NET 10 SDK** | Runs the backend. Check: `dotnet --list-sdks` |
| **SQL Server Express** (instance `SQLEXPRESS`) | The database |
| **SSMS** (SQL Server Management Studio) | To run the SQL scripts and look at tables |
| **Visual Studio 2022/2026** with *ASP.NET and web development* (optional) | Easiest way to run and debug. VS Code + `dotnet` CLI also works |
| **Git** | To get the code |

> Install everything and run the backend once **while you have internet**. NuGet packages are downloaded on the first build.

---

## 2. Setup (first time)

### 2.1 Get the code
```bash
git clone <repo-url>
cd CityBite
```

### 2.2 Create the database
In **SSMS** connect to `.\SQLEXPRESS` (Windows Authentication, tick *Trust server certificate*), then:

1. Right-click **Databases → New Database…** → name it `CityBite` → OK.
2. **File → Open** `Database/01_Schema.sql` → choose **CityBite** in the database dropdown → **Execute**. (21 tables)
3. **File → Open** `Database/02_Seed_Lookups.sql` → **CityBite** → **Execute**. (areas, cuisines, food types, promotion packages)

Or from a terminal:
```bash
sqlcmd -S ".\SQLEXPRESS" -E -C -Q "CREATE DATABASE CityBite"
sqlcmd -S ".\SQLEXPRESS" -E -C -I -d CityBite -i Database/01_Schema.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -I -d CityBite -i Database/02_Seed_Lookups.sql
```
> Using `sqlcmd`? Always add `-I`. Without it you get a `QUOTED_IDENTIFIER` error when changing the Users table.

### 2.3 Connection string (only if your SQL Server is different)
`CityBite.Api/appsettings.json`:
```json
"ConnectionStrings": {
  "CityBiteDb": "Server=.\\SQLEXPRESS;Database=CityBite;Trusted_Connection=True;TrustServerCertificate=True"
}
```
If your instance has another name (e.g. `.\MSSQLSERVER01` or `(localdb)\MSSQLLocalDB`), change `Server=` here only.

### 2.4 Add demo data (so every screen has something to show)
```bash
cd CityBite.Api
dotnet run -- --seed-demo
```
In Visual Studio: pick the **seed-demo** profile next to the green ▶ and run it once.
It only runs on an empty database (no restaurants yet). It adds 8 restaurants, 27 dishes, 15 customers, ~190 bills and ~700 reviews.

**Start again from zero:** delete the `CityBite` database and repeat 2.2 and 2.4.

---

## 3. Run the backend

- **Visual Studio:** open `CityBite.slnx`, choose the **http** profile, press ▶. Swagger opens in the browser.
- **Terminal:**
  ```bash
  cd CityBite.Api
  dotnet run --launch-profile http
  ```

The API listens on **port 5000 on every network address** of the laptop.

| Check | URL |
|---|---|
| Is it running? Can it reach the DB? | http://localhost:5000/api/health → `{"api":"running","database":"connected"}` |
| Swagger (try every endpoint) | http://localhost:5000/swagger |
| Raw OpenAPI document | http://localhost:5000/openapi/v1.json |

**Swagger with login:** call `POST /api/auth/login`, copy the `token`, click **Authorize** (top right), paste it, then call protected endpoints.

`CityBite.Api/CityBite.Api.http` has ready-made requests — in Visual Studio click *Send request* above each one.

First run: if Windows Firewall asks, allow **Private networks**, otherwise phones can't connect.

---

## 4. Connect your app to the backend

Put the base URL in **one place** in your app (a constant / config / `.env`) so you only change one line when the IP changes.

| Where your app runs | Base URL |
|---|---|
| React web app / browser on the same laptop | `http://localhost:5000` |
| Android **emulator** | `http://10.0.2.2:5000` |
| Real Android phone with **USB cable** (no Wi-Fi needed) | run `adb reverse tcp:5000 tcp:5000`, then `http://localhost:5000` |
| Real phone on the same **Wi-Fi / hotspot** | `http://<laptop-IP>:5000` — find the IP with `ipconfig` (IPv4 Address), e.g. `http://192.168.100.66:5000` |
| iOS simulator | `http://localhost:5000` |

Test from the phone first: open `http://<laptop-IP>:5000/api/health` in the phone's browser.

**Offline network:** turn on a phone hotspot with mobile data **off** and connect the laptop and phones to it. It is a local network without internet — that's enough.

### Plain HTTP must be allowed
The backend uses `http://` (no certificate) so it works offline.

- **Android (Kotlin, Flutter, React Native):** `android/app/src/main/AndroidManifest.xml`
  ```xml
  <application android:usesCleartextTraffic="true" ... >
  ```
- **iOS (Flutter / React Native):** add `NSAppTransportSecurity → NSAllowsArbitraryLoads = YES` in `Info.plist`.
- **React (web):** nothing — CORS is already open in the backend.

---

## 5. Demo accounts and codes

All demo accounts use the password **`secret123`**.

| Who | Login (email or mobile) | Role / tab |
|---|---|---|
| Sana Tariq (customer, has favourites + taste picks) | `03001234567` or `sana.tariq@citybite.demo` | `customer` |
| Other customers | `03001234568` … `03001234581` (Ayesha Khan, Hamza Raza, …) | `customer` |
| Tabaq Kitchen | `03007654321` | `restaurant_owner` |
| Spice Villa | `03007654322` | `restaurant_owner` |
| BBQ House | `03007654323` | `restaurant_owner` |
| Milano's Pizzeria | `03007654324` | `restaurant_owner` |
| Fast Bites | `03007654325` | `restaurant_owner` |
| Sweet House | `03007654326` | `restaurant_owner` |
| Desi Dhaba | `03007654327` | `restaurant_owner` |
| Dragon Wok | `03007654328` | `restaurant_owner` |

**Unused bill codes to test reviews:** `K7M4QX` (Tabaq Kitchen, bill #10432: Chicken Karahi + Garlic Naan) and
`H4P9ZD` (Tabaq Kitchen, bill #10444). Each code works for 4 people and expires 7 days after the bill.
After testing, make a new code by logging in as Tabaq Kitchen and generating a bill.

**Sponsored on Home:** seeding gives Milano's Pizzeria a 7-day "Featured on Home" promotion (it started the day before
you seed, so it shows for about 6 days). When it ends, log in as Milano's and start a new one (`POST /api/my-restaurant/promotions`).

**OTP codes (offline):** SMS/email can't be sent offline, so the code is
- returned in the API response as **`devOtp`**, and
- printed in the backend console: `OTP for user 5 (0300…) [signup]: 4821`.

Set `"Otp": { "ShowInResponse": false }` in `appsettings.json` to hide `devOtp`.

---

## 6. API basics (read this before coding)

**JSON in, JSON out.** Field names are camelCase: `emailOrPhone`, `restaurantId`, `avgRating`.

**Login token.** Login (or verify-otp) returns:
```json
{ "token": "eyJhbGciOi...", "expiresAt": "2026-12-14T10:00:00Z",
  "user": { "userId": 1, "fullName": "Sana Tariq", "role": "customer", "email": "...", "mobile": "03001234567",
            "areaId": 1, "restaurantId": null } }
```
Save the token (DataStore / SharedPreferences / SecureStore / cookie or localStorage) and send it on **every** request:
```
Authorization: Bearer eyJhbGciOi...
```
Tokens last 30 days. On app start call `GET /api/auth/me` — if it returns **401**, show the login screen.
Restaurant owners get `restaurantId` in `user`.

**Roles.** `customer` and `restaurant_owner`. Using an endpoint of the other role returns **403**.

**Errors** always look like this — just show `message` to the user:
```json
{ "message": "The code is wrong or has expired." }
```
Validation errors (missing field, password too short) come as ASP.NET's standard `errors` object with **400**.

| Status | Meaning |
|---|---|
| 200 / 201 / 204 | OK (204 = OK with no body) |
| 400 | Something in your request is wrong |
| 401 | Not logged in, wrong password, or token missing/expired |
| 403 | Logged in but not allowed (wrong role, or account not verified) |
| 404 | Not found |
| 409 | Already exists / can't do it because of existing data |

**Dates** are UTC with `Z` (`2026-11-14T16:59:09Z`). Convert to local time in the app.
`startDate`/`endDate` of promotions are plain dates (`2026-11-14`).

**Photos** come as a path: `"photoUrl": "/uploads/demo/chicken-karahi.jpg"`. Show it with **base URL + path**:
`http://10.0.2.2:5000/uploads/demo/chicken-karahi.jpg`.
Uploads are `multipart/form-data` with one field named **`file`** (JPG/PNG/WEBP, max 5 MB).

**Lists with pages** return:
```json
{ "items": [ ... ], "total": 48, "page": 1, "pageSize": 20 }
```
Ask for more with `?page=2`. `pageSize` max is 50.

**Prices** are in rupees as numbers (`850.0`). Dishes with sizes have `price` = cheapest size.

**Opening hours:** `dayOfWeek` 1 = Monday … 7 = Sunday. A closing time of `00:00` means midnight.

---

## 7. Endpoints by screen

Screen numbers match the mockups (`CityBite_Mockups_PNG_v4`). 🔓 = no login · 👤 = customer · 🍽 = restaurant owner · 🔑 = any logged-in user

### Onboarding and login (01–11)
| Screen | Method & URL | |
|---|---|---|
| 02/03 Log in | `POST /api/auth/login` `{ emailOrPhone, password, role }` | 🔓 |
| 04 Reset password | `POST /api/auth/forgot-password` `{ emailOrPhone }` → `POST /api/auth/reset-password` `{ emailOrPhone, code, newPassword }` | 🔓 |
| 05 Create account | `POST /api/auth/signup/customer` `{ fullName, emailOrPhone, password }` | 🔓 |
| 06 Set up restaurant | `POST /api/auth/signup/restaurant` `{ restaurantName, areaId, address, emailOrPhone, password }` | 🔓 |
| 07/08 Verify | `POST /api/auth/verify-otp` `{ emailOrPhone, code }` → token · `POST /api/auth/resend-otp` | 🔓 |
| 10 Taste picker | `GET /api/cuisines` (parents + types) · `PUT /api/me/taste` `{ foodTypeIds: [1,5,9] }` | 🔓 / 🔑 |
| 11 Choose area | `GET /api/areas` · `PUT /api/me/area` `{ areaId }` | 🔓 / 🔑 |
| App start | `GET /api/auth/me` | 🔑 |

`emailOrPhone` accepts `03001234567`, `0300 1234567`, `+923001234567` or an email.

### Customer — discover (12–23)
| Screen | Method & URL | |
|---|---|---|
| 12 Home | `GET /api/home` (send the token to get your own chips & area) · tap a chip: `GET /api/home?foodTypeId=5` | 🔓 |
| 13 Explore | `GET /api/cuisines` · `GET /api/restaurants?sort=top_rated` · sponsored card from `/api/home` | 🔓 |
| 14/15 Filters & results | `GET /api/dishes?cuisineIds=1&cuisineIds=2&minPrice=500&maxPrice=1000&minRating=4&sort=top_rated` · restaurants tab: `GET /api/restaurants?cuisineIds=1&minRating=4` | 🔓 |
| 16/17 Search | `GET /api/dishes?q=pizza` · `GET /api/restaurants?q=pizza` | 🔓 |
| 18 Filters on search | same as 14 plus `q=…`, `withPhotos=true` | 🔓 |
| 19 Favourites | `GET /api/me/favorites` · heart: `PUT` / `DELETE /api/me/favorites/dishes/{dishId}` and `/api/me/favorites/restaurants/{restaurantId}` | 👤 |
| 20 Restaurant page | `GET /api/restaurants/{id}` (from a sponsored card add `?src=sponsored`) | 🔓 |
| 21/22 Dish page | `GET /api/dishes/{id}` | 🔓 |
| 23 Dish reviews | `GET /api/dishes/{id}/reviews?page=1` | 🔓 |

Dish search parameters: `q`, `cuisineIds` (repeat), `foodTypeId`, `areaId`, `restaurantId`, `minPrice`, `maxPrice`,
`minRating`, `withPhotos`, `availableOnly`, `sort` = `top_rated` | `most_reviewed` | `price_asc` | `price_desc`, `page`, `pageSize`.
Restaurant list parameters: `q`, `cuisineIds`, `areaId`, `minRating`, `openNow`, `sort` = `top_rated` | `most_reviewed` | `name`.

`rank` on a dish = its position among dishes of the same food type in the city ("#1 rated karahi").
Send the token on 20/21 to get `isFavorite`.

### Customer — reviews and profile (24–28)
| Screen | Method & URL | |
|---|---|---|
| 24 Reviews tab | `GET /api/me/reviews?page=1` | 👤 |
| 25/26 Add review (enter code) | `POST /api/reviews/redeem` `{ code }` → bill + dishes (`billItemId`, `alreadyRated`) | 👤 |
| 27 Rate dishes | `POST /api/reviews` `{ billId, ratings: [{ billItemId, rating, comment }] }` → review ids | 👤 |
| 27 Add photo | `POST /api/reviews/{reviewId}/photos` (multipart `file`, up to 3 per review) | 👤 |
| 28 Profile | `GET /api/me` · `PUT /api/me` `{ fullName }` · `PUT /api/me/password` `{ currentPassword, newPassword }` | 🔑 |

### Restaurant (29–40)
| Screen | Method & URL | |
|---|---|---|
| 29 Generate bill | `GET /api/my-restaurant/bill-menu` · `POST /api/my-restaurant/bills` `{ tableNo, items: [{ dishId, sizeId, qty }] }` | 🍽 |
| 30 Bill generated / reprint | response of the POST · `GET /api/my-restaurant/bills/{id}` · history `GET /api/my-restaurant/bills` | 🍽 |
| 31 Your menu | `GET /api/my-restaurant/dishes?categoryId=` · `GET/POST/PUT/DELETE /api/my-restaurant/categories[/{id}]` · `PATCH /api/my-restaurant/dishes/{id}/availability` `{ isAvailable }` · `DELETE /api/my-restaurant/dishes/{id}` | 🍽 |
| 32 Add / edit dish | `POST /api/my-restaurant/dishes` · `PUT /api/my-restaurant/dishes/{id}` · photo `POST /api/my-restaurant/dishes/{id}/photo` | 🍽 |
| 33 Sizes | inside the dish body: `sizes: [{ sizeId, label, price }]` (no `sizeId` = new size) | 🍽 |
| 34 Ratings & reviews | `GET /api/my-restaurant/reviews?dishId=&page=` | 🍽 |
| 35 Profile | `GET /api/me` | 🍽 |
| 37 Restaurant details | `GET /api/my-restaurant` · `PUT /api/my-restaurant` `{ name, description, address, areaId, cuisineIds }` · `POST /api/my-restaurant/logo` · `POST /api/my-restaurant/cover` | 🍽 |
| 38 Opening hours | `GET /api/my-restaurant/opening-hours` · `PUT` `{ days: [ 7 × { dayOfWeek, isClosed, openTime: "11:00", closeTime: "00:00" } ] }` | 🍽 |
| 39 Promote | `GET /api/promotion-packages` · `POST /api/my-restaurant/promotions` `{ packageId, durationDays: 7 | 14 | 30 }` | 🔓 / 🍽 |
| 40 Your promotion | `GET /api/my-restaurant/promotions` · `POST …/promotions/{id}/extend` `{ durationDays }` · `POST …/promotions/{id}/stop` | 🍽 |

Full details and example bodies: **Swagger** (`/swagger`) and `CityBite.Api/CityBite.Api.http`.

---

## 8. Main flows step by step

### Sign up and log in
1. `POST /api/auth/signup/customer` → `{ message, sentTo, devOtp }`
2. Show the 4-digit OTP screen → `POST /api/auth/verify-otp` → **token** (user is now logged in)
3. Next time: `POST /api/auth/login` with `role` = the tab the user picked (`customer` / `restaurant_owner`).
   - 403 "Please verify your number first" → call `resend-otp` and show the OTP screen.

### Bill → review code → rating (the core of CityBite)
```
Restaurant app                      Backend                          Customer app
──────────────                      ───────                          ────────────
GET  bill-menu  ───────────────────▶ dishes + sizes
POST bills {dishId,sizeId,qty} ────▶ prices from DB, total,
                                     BillNo, ReviewCode (K7M4QX),
                                     saved in Bills/BillItems
print bill with the code ◀────────── BillDto
                                                                     customer types K7M4QX
                                     checks: exists, not expired, ◀── POST reviews/redeem
                                     max 4 people; saves CodeUse
                                     ─────────────────────────────▶ dishes on the bill
                                                                     user gives stars
                                     saves Reviews, updates       ◀── POST reviews
                                     dish + restaurant ratings
```
- The app sends only **IDs and quantities**. The backend takes prices from the database and calculates the total.
- A code works for **7 days** and for up to **4 people** (friends at the same table).
- Each person can rate each dish on the bill **once**.

---

## 9. First API call in each technology

### Kotlin (Android) — Retrofit
```kotlin
// build.gradle.kts
implementation("com.squareup.retrofit2:retrofit:2.11.0")
implementation("com.squareup.retrofit2:converter-gson:2.11.0")
implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
```
```kotlin
const val BASE_URL = "http://10.0.2.2:5000/"   // emulator; change for a real phone

data class LoginRequest(val emailOrPhone: String, val password: String, val role: String)
data class UserDto(val userId: Int, val fullName: String, val role: String, val restaurantId: Int?)
data class AuthResponse(val token: String, val expiresAt: String, val user: UserDto)

interface CityBiteApi {
    @POST("api/auth/login") suspend fun login(@Body body: LoginRequest): AuthResponse
    @GET("api/home") suspend fun home(): HomeDto
}

val client = OkHttpClient.Builder()
    .addInterceptor { chain ->                      // adds the token to every request
        val token = TokenStore.token                // your saved token
        val req = chain.request().newBuilder()
        if (token != null) req.addHeader("Authorization", "Bearer $token")
        chain.proceed(req.build())
    }.build()

val api = Retrofit.Builder().baseUrl(BASE_URL).client(client)
    .addConverterFactory(GsonConverterFactory.create()).build()
    .create(CityBiteApi::class.java)

// in a ViewModel: val res = api.login(LoginRequest("03001234567", "secret123", "customer"))
```

### Flutter — dio
```dart
final dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:5000'));
dio.interceptors.add(InterceptorsWrapper(onRequest: (o, h) {
  if (token != null) o.headers['Authorization'] = 'Bearer $token';
  h.next(o);
}));

final res = await dio.post('/api/auth/login',
    data: {'emailOrPhone': '03001234567', 'password': 'secret123', 'role': 'customer'});
token = res.data['token'];
// errors: on DioException read e.response?.data['message']
```

### React Native — axios
```js
const api = axios.create({ baseURL: 'http://10.0.2.2:5000' });
api.interceptors.request.use(c => { if (token) c.headers.Authorization = `Bearer ${token}`; return c; });

const { data } = await api.post('/api/auth/login',
  { emailOrPhone: '03001234567', password: 'secret123', role: 'customer' });
token = data.token;
// errors: err.response?.data?.message
```

### React (web) — fetch
The React web app runs in the browser on the same laptop as the backend, so the base URL is `http://localhost:5000`.
CORS is already open in the backend, nothing to set up there.

**1. Base URL in `.env`** (project root, next to `package.json`; restart `npm run dev` after changing it)
```bash
# Vite (npm create vite@latest)
VITE_API_URL=http://localhost:5000
# Create React App instead? use: REACT_APP_API_URL=http://localhost:5000
```

**2. One API helper for the whole app — `src/api.js`**
```js
const API = import.meta.env.VITE_API_URL;          // CRA: process.env.REACT_APP_API_URL

export const getToken = () => localStorage.getItem('token');
export const setSession = (auth) => {               // call with the login / verify-otp response
  localStorage.setItem('token', auth.token);
  localStorage.setItem('user', JSON.stringify(auth.user));
};
export const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); };

// Photos come as "/uploads/..." — put the backend address in front.
export const img = (path) => (path ? `${API}${path}` : '/placeholder.jpg');

// All requests go through this: adds the token, turns errors into a readable message.
export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: form ?? (body ? JSON.stringify(body) : undefined),   // form = FormData for photo uploads
  });

  if (res.status === 401) logout();                            // token missing/expired -> show login
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.message
      ?? (data?.errors ? Object.values(data.errors).flat().join(' ') : `Request failed (${res.status})`);
    throw new Error(msg);
  }
  return data;
}
```

**3. Use it in components**
```jsx
// Login
import { api, setSession } from './api';
const auth = await api('/api/auth/login', {
  method: 'POST',
  body: { emailOrPhone: '03001234567', password: 'secret123', role: 'customer' },
});
setSession(auth);   // then navigate to Home

// Home screen
import { useEffect, useState } from 'react';
import { api, img } from './api';

export default function Home() {
  const [home, setHome] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/api/home').then(setHome).catch(e => setError(e.message)); }, []);

  if (error) return <p>{error}</p>;
  if (!home) return <p>Loading…</p>;
  return home.topForSelected.map(d => (
    <div key={d.dishId}>
      <img src={img(d.photoUrl)} alt={d.name} width={120} />
      #{d.rank} {d.name} — {d.restaurantName} ★ {d.avgRating} ({d.reviewCount})
    </div>
  ));
}

// Search with filters (repeat cuisineIds for several cuisines)
const qs = new URLSearchParams({ q: 'pizza', minRating: 4, sort: 'top_rated' });
[1, 2].forEach(id => qs.append('cuisineIds', id));
const page = await api(`/api/dishes?${qs}`);        // { items, total, page, pageSize }

// Photo upload (dish photo / review photo / logo)
const form = new FormData();
form.append('file', fileInput.files[0]);
await api(`/api/reviews/${reviewId}/photos`, { method: 'POST', form });
```

**React on a phone or another laptop?** Start the dev server with `npm run dev -- --host` and set
`VITE_API_URL=http://<laptop-IP>:5000`, then open `http://<laptop-IP>:5173` on the other device.

---

## 10. Project structure and rules

```
CityBite/
├── CityBite.slnx
├── Database/
│   ├── 01_Schema.sql          all tables, keys, checks
│   └── 02_Seed_Lookups.sql    areas, cuisines, food types, promotion packages
└── CityBite.Api/
    ├── Program.cs             setup: DB, JWT, Swagger, CORS, static files
    ├── appsettings.json       connection string, JWT, OTP settings
    ├── Controllers/           endpoints (one file per area: Auth, Dishes, Reviews, MyRestaurant…)
    ├── DTOs/                  request/response shapes (what the apps send/receive)
    ├── Services/              business logic (BillService, RatingService, PromotionService…)
    ├── Data/                  AppDbContext + DemoSeeder
    ├── Models/                entity classes generated from the database
    └── wwwroot/uploads/       photos (demo/ is in Git, uploaded photos are not)
```

**Rules**
- **Don't hand-edit `Models/` or `Data/AppDbContext.cs`.** They are generated from the database. If you change a table:
  1. change `Database/01_Schema.sql` and the database,
  2. regenerate (stop the API first):
     ```bash
     cd CityBite.Api
     dotnet ef dbcontext scaffold "Name=ConnectionStrings:CityBiteDb" Microsoft.EntityFrameworkCore.SqlServer --output-dir Models --context-dir Data --context AppDbContext --namespace CityBite.Api.Models --context-namespace CityBite.Api.Data --no-onconfiguring --force
     ```
     (needs `dotnet tool install --global dotnet-ef --version 10.0.15`).
     Our own additions live in separate files (`Data/AppDbContext.Utc.cs`) so they survive this.
- **Anything with money, codes or ratings is calculated in the backend**, never trusted from the app.
- Business logic goes in `Services/`, controllers stay thin.
- Throw `new ApiException(400, "message")` from a service to send a clean error to the app.
- The restaurant id always comes from the **token** (`User.GetRestaurantId()`), never from the request body.

---

## 11. Offline / exam checklist

Do this **before** the exam, with internet:
- [ ] Backend builds and runs (`dotnet run`) — NuGet packages are now cached.
- [ ] Your app builds with all its packages (Gradle sync / `flutter pub get` / `npm install`).
- [ ] React: don't load fonts, icons or CSS from a CDN link — install them with npm so they work offline.
- [ ] Database created and demo data seeded on **your own laptop**.
- [ ] `http://<laptop-IP>:5000/api/health` opens on your phone.
- [ ] Cleartext HTTP allowed in your app (section 4).
- [ ] Your base URL is in one config line.

Then do a full **dry run with Wi-Fi and mobile data off**: login → home → dish → (as restaurant) generate bill → (as customer) enter code → rate.

Everything in CityBite works offline: no Google Maps (areas are a list), no SMS (OTP is shown in the console/`devOtp`),
no cloud images (photos are saved on the laptop), no online payment (promotions are only recorded).

---

## 12. Working together with Git

```bash
git pull                      # get the latest backend before you start
git checkout -b feature/xyz   # your own branch for backend changes
git add .
git commit -m "Add xyz endpoint"
git push -u origin feature/xyz   # then open a Pull Request on GitHub
```
- Pull often. If the backend changed, rebuild and re-run it.
- If a change needs a database change, update `Database/01_Schema.sql` and tell the team.
- Don't commit `bin/`, `obj/`, `.vs/` or uploaded photos (`.gitignore` already handles this).
- The repository is **private** — the JWT key in `appsettings.json` is fine for this project, but don't make it public.
