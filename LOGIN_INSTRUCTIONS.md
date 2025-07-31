# 🚀 How to Fix Login and Get Started

## Problem: Login Failed ❌
The login was failing because Firebase Authentication wasn't set up yet.

## Solution: Quick Setup ✅

### Step 1: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **timing-48aba**
3. Click **"Authentication"** in the left sidebar
4. Click **"Get Started"** (if not already enabled)
5. Go to **"Sign-in method"** tab
6. Click on **"Email/Password"**
7. Toggle **"Enable"** and click **"Save"**

### Step 2: Create Test User

1. In Firebase Console > Authentication > **Users** tab
2. Click **"Add user"**
3. Enter:
   - **Email**: `admin@timing.com`
   - **Password**: `admin123`
4. Click **"Add user"**

### Step 3: Login to App

Now you can login with:
- **Email**: `admin@timing.com`  
- **Password**: `admin123`

## 🎉 What You'll See After Login

The app now includes **complete mock data** so you can explore all features:

### 📋 Orders Dashboard
- **3 sample orders** with different statuses (received, preparing, ready)
- Order details with customer info and items
- Status update functionality
- Print order tickets

### 🍽️ Menu Management  
- **5 sample menu items** (coffee & pastries)
- Add/edit/delete items
- Upload images (mock functionality)
- Toggle availability
- Manage customizations

### 📊 Sales Dashboard
- Daily sales summary with mock data
- Top selling items
- Revenue metrics
- Export functionality

### 🔔 Notifications
- Push notification setup (requires VAPID key)
- Sound controls
- Notification badges

## 🛠️ Development Mode

The app is configured to use **mock data** when running locally, so:
- ✅ No backend API required
- ✅ All features work offline
- ✅ Data persists during session
- ✅ Full functionality demo

## Next Steps (Optional)

1. **Add VAPID Key** for push notifications:
   - Firebase Console > Project Settings > Cloud Messaging
   - Generate VAPID key pair
   - Add to `.env` as `VITE_FIREBASE_VAPID_KEY`

2. **Connect Real Backend** (when ready):
   - Change `VITE_API_BASE_URL` in `.env`
   - The app will automatically switch from mock to real API

## Start Developing

```bash
npm run dev
```

Then login with `admin@timing.com` / `admin123` and explore! 🎯