# ScanStock - Inventory Management Mobile App

ScanStock is a mobile inventory management application built with Expo and React Native. It helps users track inventory items with features like barcode scanning, photo capture, platform integration, and shipping management.

## 🏗️ Project Structure

```
ScanStock/
├── src/                    # Frontend Expo app
│   ├── app/               # Expo Router routes (file-based routing)
│   │   ├── _layout.tsx    # Root layout with tab navigation
│   │   ├── index.tsx      # Home/Dashboard screen
│   │   ├── inventory.tsx  # Inventory list screen
│   │   ├── search.tsx     # Search screen
│   │   ├── sold.tsx       # Sold items screen
│   │   ├── ready-to-ship.tsx # Ready to ship screen
│   │   ├── add-item.tsx   # Add new item screen
│   │   ├── [id].tsx       # Item detail screen (dynamic route)
│   │   ├── login.tsx      # Login screen
│   │   └── *-settings.tsx # Settings screens
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utilities and hooks
│   └── config/           # Configuration files
│
├── server/                # Backend server (Hono + Prisma)
│   ├── src/
│   │   ├── index.ts      # Server entry point
│   │   ├── auth.ts       # Better Auth configuration
│   │   ├── db.ts         # Prisma client
│   │   └── routes/       # API route handlers
│   └── prisma/
│       └── schema.prisma # Database schema
│
├── shared/               # Shared code between app and server
│   └── contracts.ts      # API contracts (Zod schemas)
│
├── app.json             # Expo configuration
├── package.json         # Frontend dependencies
└── server/package.json  # Backend dependencies
```

## 📱 Features

- **Inventory Management**: Add, edit, delete, and track inventory items
- **Photo Capture**: Take photos of items using device camera
- **Platform Integration**: Support for multiple selling platforms (eBay, Amazon, Etsy, etc.)
- **Storage Management**: Organize items by bin and rack numbers
- **Shipping Tracking**: Track ship-by dates and generate shipping QR codes
- **Search**: Search inventory by name, description, or photo
- **Authentication**: Secure user authentication with Better Auth
- **Cross-platform**: Works on iOS, Android, and Web

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone https://github.com/HubbTechDev/ScanStock.git
cd ScanStock
```

2. Install frontend dependencies:
```bash
bun install
```

3. Install backend dependencies:
```bash
cd server
bun install
cd ..
```

4. Set up environment variables:
Create a `.env` file in the `server/` directory:
```env
DATABASE_URL="file:./prisma/dev.db"
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters-long"
BACKEND_URL="http://localhost:3000"
PORT=3000
```

5. Initialize the database:
```bash
cd server
bunx prisma migrate dev --name init
cd ..
```

### Running the App

1. Start the backend server:
```bash
cd server
bun run dev
```

2. In a new terminal, start the Expo dev server:
```bash
bun start
```

3. Scan the QR code with Expo Go app or press:
   - `i` for iOS simulator
   - `a` for Android emulator
   - `w` for web browser

## 🛠️ Tech Stack

### Frontend
- **Expo SDK 53** - React Native framework
- **Expo Router** - File-based routing
- **NativeWind** - Tailwind CSS for React Native
- **React Query** - Server state management
- **Zustand** - Client state management
- **Lucide React Native** - Icons
- **Better Auth** - Authentication
- **Expo Camera** - Camera access for photos and barcodes

### Backend
- **Bun** - JavaScript runtime
- **Hono** - Web framework
- **Prisma** - ORM with SQLite
- **Better Auth** - Authentication
- **Zod** - Schema validation

## 📝 Scripts

### Frontend (Root)
- `bun start` - Start Expo development server
- `bun run android` - Open on Android
- `bun run ios` - Open on iOS
- `bun run web` - Open in web browser
- `bun run typecheck` - Type check TypeScript

### Backend (server/)
- `bun run dev` - Start backend with hot reload
- `bun run build` - Build for production
- `bun run start` - Run production build
- `bunx prisma studio` - Open Prisma Studio (database GUI)
- `bunx prisma migrate dev` - Create and apply migration

## 🗄️ Database Schema

The app uses SQLite with Prisma ORM. Main models:

- **User** - User accounts with email authentication
- **Session** - User sessions
- **Account** - OAuth accounts
- **InventoryItem** - Inventory items with:
  - Basic info (name, description, image)
  - Location (bin number, rack number)
  - Platform and status
  - Pricing and shipping info

## 🔐 Authentication

Authentication is handled by Better Auth with:
- Email/password sign up and sign in
- Secure session management
- Integration with Expo for mobile
- Cross-domain cookie support

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private repository. For questions or issues, contact the maintainers.

## 📞 Support

For support, email djhelectricalwork@gmail.com
