# Setup Instructions

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_VAPID_KEY=your_vapid_key
VITE_API_BASE_URL=http://localhost:8000/api
```

3. **Update Firebase Service Worker:**
Edit `public/firebase-messaging-sw.js` with your Firebase config.

4. **Add notification sound:**
Replace `public/notification-sound.mp3` with an actual MP3 file for notifications.

5. **Start development server:**
```bash
npm run dev
```

## Firebase Setup Required

### 1. Authentication
- Enable Email/Password authentication in Firebase Console
- Create admin users for staff access

### 2. Cloud Messaging
- Generate VAPID key in Firebase Console
- Add the VAPID key to your `.env` file
- Configure notification settings

### 3. Storage
- Enable Firebase Storage for menu item images
- Configure security rules for image uploads

### 4. Security Rules
Configure appropriate security rules for your project.

## API Integration

The application expects a backend API with these endpoints:
- POST `/api/admin/login` - Authentication
- GET `/api/admin/orders` - Fetch orders
- PUT `/api/admin/orders/:id/status` - Update order status
- GET/POST/PUT/DELETE `/api/admin/menu` - Menu management
- GET `/api/admin/sales/today` - Sales data
- POST `/api/admin/fcm-token` - Save FCM token
- POST `/api/admin/menu/upload` - Image upload

## Production Deployment

1. Build the application: `npm run build`
2. Deploy `dist/` folder to your hosting service
3. Ensure HTTPS is configured for PWA features
4. Configure your API server endpoints

## Troubleshooting

- **Notifications not working:** Check browser permissions and VAPID key
- **Images not uploading:** Verify Firebase Storage configuration
- **Authentication issues:** Check Firebase Auth settings
- **API errors:** Ensure backend server is running and accessible