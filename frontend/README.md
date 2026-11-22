# CityBite — React web app (connected to the CityBite API)

This is the **frontend** of CityBite. It talks to the ASP.NET Core backend in `../backend` (which uses SQL Server).
The design is unchanged from the client mockups (orange `#e2632f`, cream `#fdfbf6`, white).

```bash
npm install        # first time only
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
```

The backend address is in `.env`:

```
VITE_API_URL=http://localhost:5000
```

Full setup (database + backend + frontend) is in the **README.md one folder up**.

## Where things are

```
src/
  config.js              API address (from .env)
  App.jsx                all routes
  services/              ONE file per part of the API  (all fetch() calls live here)
    apiClient.js         fetch wrapper: token, errors, photo URLs
    authService.js       /api/auth/*
    browseService.js     /api/home /dishes /restaurants /areas /cuisines /promotion-packages
    meService.js         /api/me/*  (profile, area, taste, favourites, my reviews)
    reviewService.js     /api/reviews/*  (bill code, ratings, photos)
    billService.js       /api/my-restaurant/bill-menu + bills
    myRestaurantService.js  /api/my-restaurant/*  (details, hours, menu, reviews, promotions)
  context/               AuthContext (token + user), AppContext (areas, cuisines, favourites, my restaurant)
  hooks/                 useAsync (load data), usePaged (lists with "Load more"), useAuth, useApp, useLocalStorage
  pages/                 auth/ customer/ restaurant/ + Landing, NotFound
  components/            common, layout, cards, forms, loaders, reviews
  styles/                variables.css  global.css  components.css  pages.css  responsive.css
  assets/images/         pictures that belong to the design (landing, login art, cuisine circles)
```

## How a screen gets its data

```jsx
const { data, loading, error, reload } = useAsync(() => browseService.dish(id), [id]);
if (error) return <ErrorState error={error} onRetry={reload} />;   // "Server not reachable" / message from backend
if (loading) return <Skeleton ... />;
```

Lists that come in pages use `usePaged` (adds a **Load more** button). Photos are shown with `img(path)` which puts the server address in front of `/uploads/...`.
