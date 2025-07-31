# Timing Coffee Shop - Back Office Management System

A comprehensive back office management system for restaurant staff to handle incoming orders, manage menu items, and track sales.

## Features

### 🏪 Order Management
- Real-time orders dashboard with queue management
- Order status tracking (received → preparing → ready → completed)
- Detailed order view with customer information
- Print functionality for order tickets
- Manual refresh and automatic updates

### 🔔 Push Notifications
- Firebase Cloud Messaging integration
- Real-time new order notifications
- Sound alerts for incoming orders
- Background service worker support
- Notification badges and counters

### 🍽️ Menu Management
- Complete CRUD operations for menu items
- Image upload to Firebase Storage
- Customization options management
- Availability toggle (show/hide items)
- Category-based organization
- Search and filter functionality

### 📊 Sales Analytics
- Daily sales summary dashboard
- Revenue tracking and reporting
- Top-selling items analysis
- Export functionality (CSV)
- Performance metrics and insights

### 🔐 Authentication & Security
- Firebase Authentication integration
- JWT token-based API authentication
- Protected routes and role-based access
- Secure user session management

### 🎨 User Interface
- Responsive design for desktop and tablet
- Modern UI with Tailwind CSS
- Intuitive navigation and layout
- Real-time status updates
- Professional design system

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router v6
- **State Management**: React Context
- **Notifications**: Sonner + Firebase Cloud Messaging
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **HTTP Client**: Fetch API

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Firebase project with:
  - Authentication enabled
  - Cloud Messaging configured
  - Storage bucket created

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd timing-backoffice
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_API_BASE_URL=http://localhost:8000/api
```

4. Update Firebase service worker:
Edit `public/firebase-messaging-sw.js` with your Firebase config.

5. Start the development server:
```bash
npm run dev
```

### API Integration

The app expects the following API endpoints:

- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/orders` - Fetch orders with optional filters
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET/POST/PUT/DELETE /api/admin/menu` - Menu management
- `GET /api/admin/sales/today` - Daily sales summary
- `POST /api/admin/menu/upload` - Image upload
- `POST /api/admin/fcm-token` - Save FCM token

### Firebase Setup

1. **Authentication**: Enable Email/Password auth
2. **Cloud Messaging**: 
   - Generate VAPID key
   - Configure service worker
3. **Storage**: Create bucket for menu images
4. **Security Rules**: Configure appropriate rules

### Deployment

1. Build the app:
```bash
npm run build
```

2. Deploy to your hosting platform
3. Configure Firebase hosting (optional)
4. Set up HTTPS for PWA features

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API and Firebase services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

public/
├── firebase-messaging-sw.js  # Service worker
└── manifest.json            # PWA manifest
```

## Key Components

- **Layout**: Main app layout with navigation
- **Orders**: Order management dashboard
- **OrderDetails**: Detailed order view
- **Menu**: Menu item management
- **Sales**: Sales analytics dashboard
- **Settings**: App configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

Private - Timing Coffee Shop Internal Use Only