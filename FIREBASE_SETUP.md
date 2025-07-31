# Firebase Setup for Login

## Quick Fix for Login Issue

The login system now works with Firebase Authentication directly. Here's how to set it up:

### 1. Enable Authentication in Firebase Console

1. Go to https://console.firebase.google.com
2. Select your project: `timing-48aba`
3. Click "Authentication" in the left sidebar
4. Click "Get Started" if not already enabled
5. Go to "Sign-in method" tab
6. Enable "Email/Password" provider

### 2. Create a Test User

In Firebase Console > Authentication > Users:
1. Click "Add user"
2. Email: `admin@timing.com`
3. Password: `admin123`
4. Click "Add user"

### 3. Test Login

Now you can login with:
- **Email**: `admin@timing.com`
- **Password**: `admin123`

## Current Setup

The app is now configured to:
- ✅ Use Firebase Auth for login (no backend required)
- ✅ Use mock data for orders, menu, and sales
- ✅ Work completely offline for development

## What Works Now

- Login with Firebase Auth
- View mock orders (3 sample orders)
- Manage mock menu items (5 sample items)
- View sales dashboard with sample data
- All CRUD operations on mock data
- Order status updates
- Print functionality

## Next Steps (Optional)

If you want to connect to a real backend later:
1. Change `VITE_API_BASE_URL` in `.env` to your API server
2. Remove the mock data fallbacks
3. Implement real API endpoints

## Current Demo Data

**Orders**: 3 sample orders with different statuses
**Menu**: 5 coffee/pastry items with customizations
**Sales**: Mock daily sales data with revenue metrics

Just login with the test user above and explore all features!