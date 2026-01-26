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

- [Bun](https://bun.sh/) runtime (v1.0.0 or higher)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (installed automatically with dependencies)
- iOS Simulator (Mac only) or Android Emulator (optional, for mobile testing)

> 📚 **Need more help?** See the comprehensive [Setup Guide (SETUP.md)](SETUP.md) for detailed instructions and troubleshooting.

### Quick Setup (Recommended)

We've created an automated setup script that handles everything for you:

```bash
# Clone the repository
git clone https://github.com/HubbTechDev/ScanStock.git
cd ScanStock

# Run the automated setup script
bun run setup
```

The setup script will:
- ✓ Check that Bun is installed
- ✓ Install all frontend and backend dependencies
- ✓ Create a `.env` file with a secure random secret
- ✓ Initialize the SQLite database
- ✓ Run database migrations

That's it! Skip to [Running the App](#running-the-app) below.

### Manual Setup (Alternative)

If you prefer to set up manually or the automated script doesn't work:

1. **Clone the repository:**
```bash
git clone https://github.com/HubbTechDev/ScanStock.git
cd ScanStock
```

2. **Install frontend dependencies:**
```bash
bun install
```

3. **Install backend dependencies:**
```bash
cd server
bun install
cd ..
```

4. **Set up environment variables:**

Copy the example file and edit it:
```bash
cp server/.env.example server/.env
```

Then edit `server/.env` and replace the `BETTER_AUTH_SECRET` with a secure random string (at least 32 characters). You can generate one using:
```bash
openssl rand -base64 32
```

5. **Initialize the database:**
```bash
cd server
bunx prisma generate
bunx prisma migrate deploy
cd ..
```

### Running the App

Once setup is complete, you'll need two terminal windows:

**Terminal 1 - Start the backend server:**
```bash
cd server
bun run dev
```

The server will start on http://localhost:3000

**Terminal 2 - Start the Expo development server:**
```bash
bun start
```

Then choose how to run the app:
- Press `i` for iOS simulator (Mac only)
- Press `a` for Android emulator
- Press `w` for web browser
- Scan the QR code with the [Expo Go](https://expo.dev/client) app on your phone

### Environment Variables

The backend requires the following environment variables (in `server/.env`):

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment (development/production) | `development` | No |
| `DATABASE_URL` | SQLite database path | `file:./prisma/dev.db` | Yes |
| `BETTER_AUTH_SECRET` | Auth secret (≥32 chars) | - | **Yes** |
| `BACKEND_URL` | Backend URL for auth | `http://localhost:3000` | Yes |

**Note:** A `.env.example` file is provided in the `server/` directory with all variables pre-configured for local development.

### Troubleshooting

**Check environment configuration:**
- Run: `bun run check-env` or `node scripts/check-env.js`
- This will validate all environment variables and show any issues

**"Bun is not installed" error:**
- Install Bun from https://bun.sh
- Run: `curl -fsSL https://bun.sh/install | bash`

**"BETTER_AUTH_SECRET must be at least 32 characters" error:**
- Generate a secure secret: `openssl rand -base64 32`
- Update the `BETTER_AUTH_SECRET` in `server/.env`

**Database errors:**
- Delete the database and reinitialize:
  ```bash
  rm server/prisma/dev.db*
  cd server
  bunx prisma migrate deploy
  ```

**Port already in use:**
- Change the `PORT` in `server/.env` to a different number (e.g., 3001)
- Update `BACKEND_URL` to match the new port

**Expo not starting:**
- Clear the cache: `npx expo start --clear`
- Delete node_modules and reinstall: `rm -rf node_modules && bun install`

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

### Setup
- `bun run setup` - Automated setup script (checks prerequisites, installs dependencies, creates .env, initializes database)
- `bun run check-env` - Validate environment configuration

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
- `bun run typecheck` - Type check TypeScript

### Database Management
From root directory:
- `bun run db:migrate` - Create and apply new migration
- `bun run db:reset` - Reset database (careful: deletes all data!)
- `bun run db:studio` - Open Prisma Studio (database GUI)

From server directory:
- `bunx prisma studio` - Open Prisma Studio (database GUI)
- `bunx prisma migrate dev` - Create and apply migration
- `bunx prisma migrate deploy` - Apply pending migrations
- `bunx prisma generate` - Regenerate Prisma client

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

Interested in contributing? Check out our [Contributing Guide (CONTRIBUTING.md)](CONTRIBUTING.md) for:
- Development workflow
- Code style guidelines
- How to submit changes
- Database migration process

For questions or issues, contact the maintainers.

## 📞 Support

For support, email djhelectricalwork@gmail.com
