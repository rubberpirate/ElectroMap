# ElectroMap

ElectroMap is a full-stack web application for finding EV charging stations, checking charger availability, viewing station details, saving favourite stations, and managing station data through an admin panel.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, MapLibre, Zustand
- Backend: Node.js, Express, MongoDB, Mongoose, Socket.IO
- Authentication: JWT with protected user and admin routes

## Main Features

- User registration and login
- EV station search, filters, map view, and station detail pages
- Live charger status updates
- Saved stations and user dashboard
- Ratings and reviews
- Admin dashboard for stations, users, chargers, and analytics

## Setup

Install dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Optional frontend variables in `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_MAPTILER_KEY=your_maptiler_key
VITE_USE_MOCK_DATA=false
```

Run the backend:

```bash
cd server
npm run dev
```

Run the frontend:

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173` and backend runs on `http://localhost:5000`.

## Important Scripts

- `server`: `npm run dev`, `npm start`, `npm run seed:demo`
- `client`: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`
