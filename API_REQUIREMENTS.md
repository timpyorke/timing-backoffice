# 🔌 Backend API Requirements

The back office application now requires a complete backend API. All mock data has been removed.

## 🔐 Authentication

The app uses **Firebase Authentication** for login, but expects JWT tokens from your API for subsequent requests.

### Login Flow:

1. User logs in with Firebase Auth (email/password)
2. Frontend gets Firebase ID token
3. All API requests include: `Authorization: Bearer <firebase-id-token>`
4. Your backend should verify Firebase tokens

## 📡 Required API Endpoints

### Base URL

```
http://localhost:8000/api
```

### 1. Authentication (Optional)

```http
POST /admin/login
Content-Type: application/json

{
  "email": "admin@timing.com",
  "password": "admin123"
}

Response:
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "admin@timing.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

### 2. Orders Management

```http
# Get all orders (with optional filters)
GET /admin/orders?status=received&date=2024-01-15&limit=50
Authorization: Bearer <token>

Response: Order[]

# Update order status
PUT /admin/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing" // received | preparing | ready | completed
}

Response: Order
```

### 3. Menu Management

```http
# Get all menu items
GET /admin/menu
Authorization: Bearer <token>

Response: MenuItem[]

# Create menu item
POST /admin/menu
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Latte",
  "description": "Smooth espresso with steamed milk",
  "price": 5.50,
  "category": "Coffee",
  "available": true,
  "customizations": [...]
}

Response: MenuItem

# Update menu item
PUT /admin/menu/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated name",
  "price": 6.00,
  "available": false
}

Response: MenuItem

# Delete menu item
DELETE /admin/menu/:id
Authorization: Bearer <token>

Response: 204 No Content
```

### 4. Sales Analytics

```http
# Get daily sales summary
GET /admin/sales/today?date=2024-01-15
Authorization: Bearer <token>

Response: DailySales
```

### 5. File Upload

```http
# Upload menu item image
POST /admin/menu/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData: { image: File }

Response:
{
  "url": "https://your-storage.com/images/menu-item.jpg"
}
```

### 6. FCM Token (Optional)

```http
# Save FCM token for push notifications
POST /admin/fcm-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "fcm-registration-token"
}

Response: 200 OK
```

## 📊 Data Types

### Order

```typescript
interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  status: "received" | "preparing" | "ready" | "completed";
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number;
  specialInstructions?: string;
}

interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations: Customization[];
}

interface Customization {
  id: string;
  name: string;
  value: string;
  additionalPrice: number;
}
```

### MenuItem

```typescript
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  customizations: CustomizationOption[];
  createdAt: Date;
  updatedAt: Date;
}

interface CustomizationOption {
  id: string;
  name: string;
  type: "select" | "multiselect" | "text";
  options: string[];
  required: boolean;
  additionalPrice?: number;
}
```

### DailySales

```typescript
interface DailySales {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
}
```

## 🔑 Authentication Notes

- All API endpoints except `/admin/login` require `Authorization: Bearer <token>`
- Tokens should be Firebase ID tokens (verify with Firebase Admin SDK)
- Frontend automatically includes tokens in all requests
- Token refresh is handled automatically by Firebase

## 🚨 Error Handling

Expected error responses:

```json
{
  "error": "Error message",
  "status": 400
}
```

Common status codes:

- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `400` - Bad request (invalid data)
- `500` - Internal server error

## 🧪 Testing

Use tools like Postman or curl to test endpoints:

```bash
# Get orders
curl -H "Authorization: Bearer your-token" \
     http://localhost:8000/api/admin/orders

# Update order status
curl -X PUT \
     -H "Authorization: Bearer your-token" \
     -H "Content-Type: application/json" \
     -d '{"status":"preparing"}' \
     http://localhost:8000/api/admin/orders/order-id/status
```

## 🔧 Development Setup

1. **Start your API server** on `http://localhost:8000`
2. **Update .env** if using different URL:
   ```env
   VITE_API_BASE_URL=http://your-api-server.com/api
   ```
3. **Ensure CORS** is configured for `http://localhost:3000`
4. **Test endpoints** with sample data

The frontend will now make real API calls and display actual data!
