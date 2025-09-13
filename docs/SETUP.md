# Setup Instructions

## Quick Start

1) Install dependencies
```bash
npm install
```

2) Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` with your values:
```env
# Backend API
VITE_API_BASE_URL=http://localhost:8000/api

# Firebase (Auth)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Supabase (Storage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3) Start development server
```bash
npm run dev
```

## Firebase Setup

- Enable Email/Password authentication in Firebase Console
- Create admin users for staff access

## Supabase Setup (Storage)

- Create a bucket (e.g., `public-images`) and make it public
- Configure appropriate storage policies as needed

## API Integration

The app expects a backend with these endpoints:
- POST `/api/admin/login` — Authentication
- GET `/api/admin/orders` — List orders
- GET `/api/admin/orders/:id` — Get order
- POST `/api/admin/orders` — Create order
- PUT `/api/admin/orders/:id/status` — Update status
- GET `/api/admin/menu` — List menu items
- POST `/api/admin/menu` — Create menu item
- PUT `/api/admin/menu/:id` — Update menu item
- DELETE `/api/admin/menu/:id` — Delete menu item
- GET `/api/admin/sales/today` — Sales data
- GET `/api/admin/sales/insights` — Insights (optional)
- GET `/api/admin/sales/top-items` — Top items (optional)

Health check used by the UI: `GET /health` (root, not `/api`).

Image uploads are handled via Supabase Storage on the client side (no API upload endpoint required).

## Production Deployment

1) Build: `npm run build`
2) Deploy the `dist/` folder to your hosting (or Vercel)
3) Ensure API server is reachable from the deployed origin

## Troubleshooting

- Images not uploading: verify Supabase URL/key and bucket policies
- Auth issues: check Firebase project credentials and auth state
- API errors: confirm `VITE_API_BASE_URL` and backend availability
