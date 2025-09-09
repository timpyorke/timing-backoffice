# Timing Coffee Shop — Back Office

Back office system for staff to manage orders, menu items, and sales.

## Features

### 🏪 Order Management
- Orders dashboard with queue filtering
- Status updates (pending → preparing → ready → completed)
- Detailed order view with customer info
- Manual refresh with configurable interval

### 🍽️ Menu Management
- CRUD for menu items
- Image upload via Supabase Storage
- Customization groups and options
- Availability toggle and category filters
- Search and basic filtering

### 📊 Sales
- Daily sales summary
- Top-selling items and insights

### 🔐 Auth & Access
- Firebase Authentication (Email/Password)
- ID token attached to backend requests
- Protected routes via React Router

### 🌐 UI & I18N
- Responsive Tailwind UI
- English/Thai language support

Note: Push notifications are not active in this codebase. Previous FCM references were removed from the UI; no service worker is included.

## Tech Stack

- Frontend: React 18 + TypeScript (Vite)
- Styling: Tailwind CSS, Lucide icons
- Routing: React Router v6
- State: React Context
- Auth: Firebase Auth
- Storage: Supabase Storage (public bucket)
- HTTP: Fetch API
- Toasts: Sonner

## Getting Started

### Prerequisites

- Node.js 16+
- npm (or yarn/pnpm)
- Firebase project (Authentication enabled)
- Supabase project (Storage enabled with a public bucket, e.g. `public-images`)

### Installation

1) Clone and install
```bash
git clone <repository-url>
cd timing-backoffice
npm install
```

2) Configure environment
```bash
cp .env.example .env
```
Fill the values in `.env`:
```env
# Backend API
VITE_API_BASE_URL=http://localhost:8000/api

# Firebase Auth (required)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Supabase Storage (required for image upload)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3) Start the dev server
```bash
npm run dev
```

## API Integration

Required endpoints (prefix assumes `/api`):
- `POST /admin/login` — Admin authentication
- `GET /admin/orders` — List orders (supports `status`, `date`, `limit`)
- `GET /admin/orders/:id` — Get single order
- `POST /admin/orders` — Create order
- `PUT /admin/orders/:id/status` — Update status
- `GET /admin/menu` — List menu items
- `POST /admin/menu` — Create menu item
- `PUT /admin/menu/:id` — Update menu item
- `DELETE /admin/menu/:id` — Delete menu item
- `GET /admin/sales/today` — Daily sales summary
- `GET /admin/sales/insights` — Sales insights (optional)
- `GET /admin/sales/top-items` — Top-selling items (optional)

Health check used by the UI: `GET /health` (no `/api` prefix).

Image uploads are handled client-side via Supabase Storage; no `/admin/menu/upload` endpoint is required.

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/            # React contexts (Auth, Language)
├── hooks/               # Custom hooks
├── pages/               # Pages (Orders, Menu, Sales, Settings, CreateOrder)
├── services/            # API, Firebase, Supabase clients
├── types/               # TypeScript types
└── utils/               # Utilities (safeStorage, formatting, localization)

public/
└── manifest.json        # PWA manifest
```

## Contributing

1) Create a feature branch
2) Make focused changes with clear rationale
3) Add/update docs where applicable
4) Open a pull request

## License

Private — Timing Coffee Shop Internal Use Only
