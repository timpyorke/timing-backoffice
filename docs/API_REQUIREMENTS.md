# API Requirements

Base URL for requests inside the app is `VITE_API_BASE_URL` (e.g., `http://localhost:8000/api`). Some utility requests (health check) hit the root without `/api`.

## Auth
- POST `/admin/login`
  - Body: `{ email: string, password: string }`
  - Returns: `{ token: string }` (token is not strictly required if using Firebase ID tokens; the app primarily uses the Firebase ID token in the `Authorization: Bearer <token>` header.)

## Orders
- GET `/admin/orders?status=&date=&limit=`
  - Returns: `Order[]` or `{ success: true, data: Order[] }`
- GET `/admin/orders/:id`
  - Returns: `Order` or `{ success: true, data: Order }`
- POST `/admin/orders`
  - Body: `CreateOrderInput`
  - Returns: `Order` or `{ success: true, data: Order }`
- PUT `/admin/orders/:id/status`
  - Body: `{ status: 'pending'|'preparing'|'ready'|'completed'|'cancelled' }`
  - Returns: `Order` or `{ success: true, data: { ... } }`
- DELETE `/admin/orders/:id`
  - Returns: 204

## Menu
- GET `/admin/menu`
  - Returns: `MenuItem[]` or `{ success: true, data: { items: MenuItem[] } }`
- POST `/admin/menu`
  - Body: `MenuItem` (without `id`, `created_at`, `updated_at`)
- PUT `/admin/menu/:id`
  - Body: `Partial<MenuItem>`
- DELETE `/admin/menu/:id`

Image uploads are performed client-side to Supabase Storage; no `/admin/menu/upload` endpoint is required.

## Sales
- GET `/admin/sales/today`
  - Returns: `DailySales`
- GET `/admin/sales/insights` (optional)
  - Returns: `SalesInsights`
- GET `/admin/sales/top-items` (optional)
  - Returns: `TopSellingItemsResponse`

## Health
- GET `/health`
  - Returns: `{ status: 'ok', timestamp: string }`

## Types
Key shapes are defined in `src/types/index.ts`:
- `Order`, `OrderItem`, `CreateOrderInput`
- `MenuItem`
- `DailySales`, `SalesInsights`, `TopSellingItemsResponse`
