# ElectroMap Code Explanation

ElectroMap is a full-stack EV charging station finder. The frontend is a Vite + React application with Tailwind-style global CSS, Zustand state stores, MapLibre maps, Socket.IO client support, and page-level routing. The backend is an Express + MongoDB API with Mongoose models, JWT authentication, admin-only routes, image uploads through Cloudinary, and Socket.IO events for live charger updates.

## Main Website Components

The website is built around these main pieces:

- **Home page**: introduces the product, shows network stats, explains the flow, and displays featured charging stations.
- **Map page**: the core experience. It shows nearby stations on a MapLibre map, supports filters, station selection, route planning, geolocation, and live availability updates.
- **Station detail page**: shows one station in depth, including images, amenities, pricing, charger list, reviews, nearby stations, save/unsave actions, and navigation links.
- **Authentication pages and modal**: allow login/register flows, token persistence, and protected access.
- **Dashboard page**: user area for saved stations, reviews, and profile-related activity.
- **Admin page**: admin-only dashboard for stations, users, chargers, analytics, and station create/edit/delete workflows.
- **Backend API**: Express routes split by domain: auth, stations, chargers, reviews, users, and admin.
- **Database models**: User, Station, Charger, and Review schemas define the MongoDB data structure.
- **Real-time layer**: Socket.IO rooms let clients subscribe to charger updates for a station.

## Project Structure

```text
full-stack/
  client/                 React frontend
  server/                 Express backend
  README.md               Project overview and setup
  Project_Report.tex      LaTeX project report
  exp.md                  This explanation document
```

## Frontend Flow

The frontend starts at `client/src/main.jsx`, mounts React into `client/index.html`, wraps the app with `BrowserRouter`, catches UI crashes through `ErrorBoundary`, and enables toast notifications.

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
```

`client/src/App.jsx` is the main route table. It lazy-loads pages, checks authentication when the app opens, and protects the dashboard and admin routes.

```jsx
<Routes location={location} key={location.pathname}>
  <Route path="/" element={<Home />} />
  <Route path="/map" element={<MapPage />} />
  <Route path="/station/:id" element={<StationDetail />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
  <Route
    path="/admin"
    element={
      <ProtectedRoute requireAdmin>
        <Admin />
      </ProtectedRoute>
    }
  />
</Routes>
```

## Backend Flow

The backend starts in `server/server.js`. It loads environment variables, creates an HTTP server, attaches Socket.IO, connects MongoDB, then starts listening.

```js
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: /* allowed origins */ } })

initSocket(io)
app.set('io', io)

connectDB()

server.listen(PORT, () => {
  console.log(`ElectroMap Server running on port ${PORT}`)
})
```

`server/app.js` configures the Express app: security middleware, CORS, JSON parsing, rate limiting, health check, API routes, and centralized error handling.

```js
app.use('/api/auth', authRoutes)
app.use('/api/stations', stationRoutes)
app.use('/api/chargers', chargerRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', protect, adminOnly, adminRoutes)

app.use(errorHandler)
```

## Main Code Snippets

### 1. Protected Routes

`client/src/components/auth/ProtectedRoute.jsx` blocks unauthenticated users and blocks non-admin users from admin screens.

```jsx
if (!isAuthenticated) {
  const redirectTarget = encodeURIComponent(buildRedirectTarget(location))
  return <Navigate to={`/login?redirect=${redirectTarget}`} replace />
}

if (requireAdmin && user?.role !== 'admin') {
  return <Navigate to="/" replace />
}
```

### 2. API Token Attachment

`client/src/services/api.js` creates one Axios client and automatically attaches the JWT token from `localStorage`.

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
```

It also handles expired or invalid sessions by removing the token and redirecting to login.

### 3. Auth Middleware

`server/middleware/auth.js` validates a Bearer token, loads the user, and attaches it to `req.user`.

```js
const protect = async (req, res, next) => {
  const token = getTokenFromRequest(req)
  if (!token) {
    return errorResponse(res, 'Authorization token required', 401)
  }

  const user = await attachUserFromToken(token)
  req.user = user
  return next()
}
```

Admin routes use `adminOnly` after `protect`.

```js
if (req.user.role !== 'admin') {
  return errorResponse(res, 'Admin access required', 403)
}
```

### 4. Station Model

`server/models/Station.js` stores station metadata, coordinates, charger counts, pricing, hours, amenities, images, ratings, and creator.

```js
location: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
  },
  coordinates: {
    type: [Number],
    required: true,
  },
},
```

The geospatial index enables nearby station queries.

```js
stationSchema.index({ location: '2dsphere' })
```

### 5. Review Rating Recalculation

`server/models/Review.js` recalculates station rating after review changes.

```js
reviewSchema.post('save', async function onSave() {
  await recalculateStationRating(this.stationId)
})
```

This keeps `Station.rating` and `Station.totalReviews` updated automatically.

### 6. Real-Time Charger Updates

`server/services/socketService.js` lets clients join station-specific rooms.

```js
socket.on('subscribe:station', (stationId) => {
  socket.join(`station:${stationId}`)
})
```

When a charger status changes, the backend emits to that station room.

```js
io.to(`station:${stationId}`).emit('charger:status_update', data)
```

### 7. Map Rendering

`client/src/components/map/MapView.jsx` uses MapLibre to render the map and Supercluster to group station markers.

```jsx
const clusterEngineRef = useRef(
  new Supercluster({
    radius: 65,
    maxZoom: 16,
    minZoom: 0,
  }),
)
```

Stations are converted into GeoJSON point features before marker rendering.

```jsx
return {
  type: 'Feature',
  properties: {
    stationId: String(station._id),
  },
  geometry: {
    type: 'Point',
    coordinates,
  },
}
```

## Client Files

### Client Root and Config

- `client/index.html`: HTML shell used by Vite. It contains the root DOM element where React mounts.
- `client/package.json`: frontend dependencies and scripts: `dev`, `build`, `lint`, and `preview`.
- `client/package-lock.json`: locked npm dependency tree for reproducible installs.
- `client/bun.lock`: Bun lockfile, likely created if dependencies were installed with Bun.
- `client/vite.config.js`: Vite build/dev-server configuration.
- `client/tailwind.config.js`: Tailwind configuration.
- `client/postcss.config.js`: PostCSS setup for CSS processing.
- `client/eslint.config.js`: ESLint rules for the React app.
- `client/README.md`: default or project-specific frontend notes.
- `client/public/favicon.svg`: browser favicon.
- `client/public/vite.svg`: Vite starter asset.

### Client Entry and Global Styles

- `client/src/main.jsx`: React entry point. Mounts `App`, router, `ErrorBoundary`, and toast provider.
- `client/src/App.jsx`: main application router and auth check.
- `client/src/App.css`: additional app-level CSS if imported by components.
- `client/src/index.css`: base CSS entry, often generated by Vite.
- `client/src/styles/globals.css`: main global stylesheet for layout, visual tokens, component classes, map styling, page styling, and responsive behavior.
- `client/src/assets/react.svg`: React starter asset.

### Pages

- `client/src/pages/Home.jsx`: landing/home page. Loads featured stations, asks for location, shows stats, calls `/stations`, and links users into the map.
- `client/src/pages/Map.jsx`: main map experience. Coordinates geolocation, map store state, station fetching, filters, selected station drawer, route planning, query params, and socket updates.
- `client/src/pages/StationDetail.jsx`: detailed station profile. Loads station data, chargers, reviews, nearby stations, image gallery, save actions, review form, and navigation links.
- `client/src/pages/Dashboard.jsx`: authenticated user dashboard for profile/saved station/review-related views.
- `client/src/pages/Admin.jsx`: admin dashboard with tabs for analytics, stations, users, and chargers. Uses charts, tables, admin API calls, and `StationFormModal`.
- `client/src/pages/Login.jsx`: login screen that uses the auth store and redirects after successful login.
- `client/src/pages/Register.jsx`: registration screen that creates a new account and stores the returned token.
- `client/src/pages/NotFound.jsx`: fallback route for unknown URLs.

### Layout Components

- `client/src/components/layout/Navbar.jsx`: top navigation, auth-aware links, and site navigation controls.
- `client/src/components/layout/Footer.jsx`: footer content and links.
- `client/src/components/layout/PageWrapper.jsx`: common page wrapper for title/class management and consistent page structure.
- `client/src/components/layout/AppLoadingScreen.jsx`: loading UI used by route-level Suspense.
- `client/src/components/layout/index.js`: barrel export for layout components.

### Auth Components

- `client/src/components/auth/ProtectedRoute.jsx`: route guard for authenticated and admin-only pages.
- `client/src/components/auth/AuthModal.jsx`: modal prompt for login/register when a user tries an authenticated action.

### Map Components

- `client/src/components/map/MapView.jsx`: MapLibre map container, marker rendering, clustering, map bounds, user marker, route layer, and viewport callbacks.
- `client/src/components/map/MapSidebar.jsx`: station list, filters, search/location controls, and map side panel UI.
- `client/src/components/map/StationMarker.jsx`: creates and updates DOM marker elements for station and cluster markers.
- `client/src/components/map/RouteLayer.jsx`: draws route GeoJSON on the map.
- `client/src/components/map/RoutePlannerPanel.jsx`: UI and logic for planning routes and charging stops.

### Station Components

- `client/src/components/station/StationCard.jsx`: reusable card for displaying a station summary.
- `client/src/components/station/StationDrawer.jsx`: slide-out station preview on the map page.

### Admin Components

- `client/src/components/admin/StationFormModal.jsx`: modal form for creating/editing station records, including station fields, charger details, amenities, and image uploads.

### UI Components

- `client/src/components/ui/Button.jsx`: reusable button with variants, sizes, and icon support.
- `client/src/components/ui/Input.jsx`: styled input component.
- `client/src/components/ui/Card.jsx`: reusable content card.
- `client/src/components/ui/Modal.jsx`: reusable modal shell.
- `client/src/components/ui/Badge.jsx`: small status/category label.
- `client/src/components/ui/Avatar.jsx`: user avatar display.
- `client/src/components/ui/Spinner.jsx`: loading spinner.
- `client/src/components/ui/RatingWidget.jsx`: star rating input/display.
- `client/src/components/ui/background-beams.tsx`: animated visual background effect.
- `client/src/components/ui/index.js`: barrel export for UI components.

### Effects and Scene Components

- `client/src/components/effects/Dither.jsx` and `Dither.css`: visual dither effect.
- `client/src/components/effects/GradientText.jsx`: gradient text display helper.
- `client/src/components/effects/Particles.jsx`: particle background/effect component.
- `client/src/components/effects/ShapeGrid.jsx` and `ShapeGrid.css`: decorative shape grid effect.
- `client/src/components/effects/SplitText.jsx`: animated split text effect.
- `client/src/components/effects/StarBorder.jsx`: bordered visual effect component.
- `client/src/components/effects/TiltedCard.jsx`: interactive tilted card effect.
- `client/src/components/effects/index.js`: barrel export for effects.
- `client/src/components/scene/LandscapeScene.jsx`: Three.js/React Three Fiber landscape scene.
- `client/src/components/scene/index.js`: barrel export for scene components.

### Error Handling

- `client/src/components/error/ErrorBoundary.jsx`: catches rendering errors and prevents the whole app from crashing.

### State Stores

- `client/src/store/authStore.js`: Zustand auth state. Stores user/token, performs login/register/logout/checkAuth/updateProfile, and syncs saved stations.
- `client/src/store/mapStore.js`: Zustand map state. Stores user location, center, zoom, filters, selected/highlighted station, and visible stations.
- `client/src/store/stationStore.js`: Zustand station state. Fetches nearby stations, fetches one station, saves/unsaves stations, and applies real-time charger status patches.

### Hooks

- `client/src/hooks/useAuth.js`: small wrapper around `authStore` selectors and actions.
- `client/src/hooks/useGeolocation.js`: browser geolocation helper that stores user coordinates in `mapStore`.
- `client/src/hooks/useSocket.js`: creates and manages a Socket.IO client connection unless mock mode is enabled.
- `client/src/hooks/useStations.js`: fetches nearby stations, handles pagination, filters, sorting, mock fallback, and writes results into the map store.

### Services, Data, and Utilities

- `client/src/services/api.js`: Axios client for API calls. Adds auth headers and handles 401 redirects.
- `client/src/data/mockStations.js`: demo station data and helper functions used when mock mode is enabled or the API fails.
- `client/src/utils/maptiler.js`: MapTiler key/style helpers, OSRM route URL builder, and geocoding suggestions.
- `client/src/utils/mockMode.js`: checks `VITE_USE_MOCK_DATA` and mock station IDs.
- `client/src/utils/cn.js`: small class-name joiner.
- `client/src/lib/utils.ts`: TypeScript utility file for shared helpers.

## Server Files

### Server Root and Config

- `server/package.json`: backend dependencies and scripts: `dev`, `start`, `seed:demo`, and placeholder `test`.
- `server/package-lock.json`: locked npm dependency tree.
- `server/.env`: local environment values. This should not be committed.
- `server/.env.example`: sample environment file for setup.
- `server/server.js`: backend process entry. Loads env, creates HTTP server, configures Socket.IO, connects MongoDB, and starts listening.
- `server/app.js`: Express app configuration, middleware, route mounting, health endpoint, and error handler.

### Config Files

- `server/config/db.js`: connects Mongoose to `MONGO_URI`; logs and skips connection if missing.
- `server/config/cloudinary.js`: configures Cloudinary and exposes image upload/delete helpers.

### Routes

- `server/routes/auth.js`: auth endpoints for register, login, logout, current user, and profile update with avatar upload.
- `server/routes/stations.js`: station endpoints for nearby/search/all/detail/create/update/delete/save/unsave.
- `server/routes/chargers.js`: charger endpoints for listing station chargers and updating charger status.
- `server/routes/reviews.js`: review endpoints for station reviews and review CRUD.
- `server/routes/users.js`: user endpoints for saved stations, user profile, and the authenticated user's reviews.
- `server/routes/admin.js`: admin endpoints for stats, users, roles, reviews, and chargers.

### Controllers

- `server/controllers/authController.js`: validates registration/login, hashes via model hooks, signs JWTs, returns sanitized users, and updates profile/avatar/password.
- `server/controllers/stationController.js`: station listing, nearby geospatial search, station details, creation, update, deletion, image upload, charger creation, save/unsave logic, and new station socket events.
- `server/controllers/chargerController.js`: lists chargers by station and updates charger status through admin auth or IoT token.
- `server/controllers/reviewController.js`: lists, creates, updates, and deletes reviews; ownership/admin checks are enforced.
- `server/controllers/userController.js`: returns saved stations, public profile data, and the current user's reviews.
- `server/controllers/adminController.js`: returns analytics, user lists, role updates, review list, and charger list for admin screens.

### Models

- `server/models/User.js`: user schema with username, email, hashed password, avatar, role, saved station references, and password comparison method.
- `server/models/Station.js`: station schema with address, geospatial location, charger totals, pricing, operating hours, amenities, images, rating, review count, verification state, and indexes.
- `server/models/Charger.js`: charger schema linked to a station with charger type, connector, power output, status, and `lastUpdated`.
- `server/models/Review.js`: review schema linked to a station and user. Enforces one review per user per station and recalculates station rating after changes.

### Middleware

- `server/middleware/auth.js`: JWT parsing, protected route middleware, optional auth middleware, and admin-only guard.
- `server/middleware/errorHandler.js`: central Express error formatter for validation, duplicate key, cast, and JWT errors.
- `server/middleware/rateLimiter.js`: general and auth-specific request limiters.
- `server/middleware/validate.js`: reusable Zod validation middleware.

### Services and Utilities

- `server/services/socketService.js`: Socket.IO room subscription and event emit helpers.
- `server/utils/apiResponse.js`: standard JSON response format for success and error responses.
- `server/utils/geoUtils.js`: Haversine distance helper for distance calculations.
- `server/utils/validationSchemas.js`: Zod schemas for auth, stations, reviews, and charger status updates.

### Seeds

- `server/seeds/seedStations.js`: demo data seeding script used by `npm run seed:demo`.

## Route Summary

### Public or Optional Auth

- `GET /api/health`: server health check.
- `GET /api/stations`: list stations.
- `GET /api/stations/nearby`: nearby stations.
- `GET /api/stations/search`: search stations.
- `GET /api/stations/:id`: station detail.
- `GET /api/chargers/station/:stationId`: chargers for a station.
- `GET /api/reviews/station/:stationId`: reviews for a station.

### Auth Required

- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/update-profile`
- `POST /api/reviews/station/:stationId`
- `PUT /api/reviews/:id`
- `DELETE /api/reviews/:id`
- `POST /api/stations/:id/save`
- `DELETE /api/stations/:id/save`
- `GET /api/users/saved-stations`
- `GET /api/users/me/reviews`
- `GET /api/users/profile/:id`

### Admin Required

- `POST /api/stations`
- `PUT /api/stations/:id`
- `DELETE /api/stations/:id`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`
- `GET /api/admin/reviews`
- `GET /api/admin/chargers`

### Special Auth

- `PUT /api/chargers/:id/status`: requires either admin auth or valid `x-iot-token`.

## Data Relationships

```text
User
  has many savedStations -> Station
  has many Review records

Station
  has many Charger records
  has many Review records
  stores aggregate rating and totalReviews

Charger
  belongs to Station
  status drives station availableChargers

Review
  belongs to User
  belongs to Station
  updates Station rating after save/delete
```

## Important Environment Variables

### Backend

- `PORT`: backend server port, default `5000`.
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: secret used to sign and verify JWT tokens.
- `JWT_EXPIRES_IN`: optional token lifetime, default `7d`.
- `CLIENT_URL`: allowed frontend origin or comma-separated origins.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary image upload config.
- `IOT_SECRET_TOKEN`: token accepted for charger status updates from external charger/IoT systems.

### Frontend

- `VITE_API_BASE_URL`: API base URL, usually `http://localhost:5000/api`.
- `VITE_SOCKET_URL`: Socket.IO server URL.
- `VITE_MAPTILER_KEY`: MapTiler key required for map rendering.
- `VITE_USE_MOCK_DATA`: when `true`, the app uses demo stations.

## How The Main User Flows Work

### Login/Register

1. User submits credentials from `Login.jsx` or `Register.jsx`.
2. `authStore` calls `/api/auth/login` or `/api/auth/register`.
3. Backend validates with Zod schemas.
4. Backend returns `{ user, token }`.
5. Frontend stores token in `localStorage`.
6. Axios attaches token to future requests.

### Finding Nearby Chargers

1. `Map.jsx` requests browser location through `useGeolocation`.
2. Coordinates are stored in `mapStore`.
3. `useStations` calls `/api/stations/nearby`.
4. Backend performs geospatial lookup using the station `2dsphere` index.
5. Results are stored in frontend state and rendered on `MapView`.

### Saving A Station

1. User clicks save from a station card/drawer/detail page.
2. `stationStore.saveStation(stationId)` calls `POST /api/stations/:id/save`.
3. Backend adds the station ID to the user's `savedStations`.
4. Frontend syncs the saved station ID list.

### Updating Charger Availability

1. Admin or IoT system calls `PUT /api/chargers/:id/status`.
2. Backend validates the new status.
3. Charger document is updated.
4. Station `availableChargers` count is recalculated.
5. Socket.IO emits `charger:status_update` to subscribed clients.
6. Frontend patches station availability in `stationStore`.

## Notes

- The app includes mock-data fallback so the frontend can still demonstrate the experience when the backend or API data is unavailable.
- Admin routes are protected twice: first by JWT authentication, then by role checking.
- Station coordinates are stored as `[lng, lat]`, which is the standard GeoJSON order used by MongoDB geospatial indexes and MapLibre.
- Review updates automatically refresh station rating totals through Mongoose model hooks.
- `server/node_modules/` and package lockfiles are dependency artifacts, not application source files.
