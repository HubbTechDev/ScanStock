# ScanStock Setup Guide

This comprehensive guide will help you set up ScanStock for local development with detailed explanations and troubleshooting.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)
7. [Common Issues](#common-issues)

## Prerequisites

### Required Software

#### 1. Bun Runtime (v1.0.0 or higher)

Bun is a fast JavaScript runtime and package manager that ScanStock uses for both frontend and backend.

**Installation:**

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows:**
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Verify installation:**
```bash
bun --version
```

#### 2. Expo CLI

Expo CLI is automatically installed with project dependencies, but you can also install it globally:

```bash
npm install -g expo-cli
# or
bun add -g expo-cli
```

#### 3. Development Tools (Optional)

For mobile development:
- **iOS Simulator** (macOS only): Installed with Xcode
- **Android Studio**: For Android emulator
- **Expo Go App**: For testing on physical devices

## Installation Methods

### Method 1: Automated Setup (Recommended) ✨

The quickest way to get started is using our automated setup script:

```bash
# 1. Clone the repository
git clone https://github.com/HubbTechDev/ScanStock.git
cd ScanStock

# 2. Run the automated setup
bun run setup
```

**What the script does:**
1. ✅ Checks that Bun is installed
2. ✅ Checks for Expo CLI availability
3. ✅ Installs frontend dependencies (`bun install`)
4. ✅ Installs backend dependencies (`cd server && bun install`)
5. ✅ Creates `.env` file from `.env.example` with auto-generated secrets
6. ✅ Initializes the SQLite database
7. ✅ Runs database migrations

### Method 2: Manual Setup

If you prefer manual control or the automated script encounters issues:

#### Step 1: Clone the Repository
```bash
git clone https://github.com/HubbTechDev/ScanStock.git
cd ScanStock
```

#### Step 2: Install Dependencies

**Frontend:**
```bash
bun install
```

**Backend:**
```bash
cd server
bun install
cd ..
```

#### Step 3: Configure Environment Variables

Copy the example environment file:
```bash
cp server/.env.example server/.env
```

Edit `server/.env` and update the following:

**Required:**
- `BETTER_AUTH_SECRET`: Generate with `openssl rand -base64 32`

**Optional (defaults provided):**
- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: Database path (default: file:./prisma/dev.db)
- `BACKEND_URL`: Backend URL (default: http://localhost:3000)
- `NODE_ENV`: Environment (default: development)

#### Step 4: Initialize Database

```bash
cd server
bunx prisma generate
bunx prisma migrate deploy
cd ..
```

## Environment Configuration

### Environment Variables Explained

#### Server Configuration

**`PORT`** (optional, default: 3000)
- The port number where the backend server will run
- Change if port 3000 is already in use

**`NODE_ENV`** (optional, default: development)
- Environment mode: `development`, `production`, or `test`
- Affects logging and error handling behavior

#### Database Configuration

**`DATABASE_URL`** (required, default: file:./prisma/dev.db)
- Path to the SQLite database file
- For local development, the default is fine
- Format: `file:./relative/path/to/db.db`

#### Authentication Configuration

**`BETTER_AUTH_SECRET`** (required, minimum 32 characters)
- Secret key used to sign and verify authentication tokens
- **MUST** be at least 32 characters long
- Generate a secure random value:
  ```bash
  openssl rand -base64 32
  ```
- **Never commit this value to version control!**

**`BACKEND_URL`** (required, default: http://localhost:3000)
- The full URL where your backend is accessible
- Used by Better Auth and the Expo client
- For local development: `http://localhost:3000`
- For production: Your deployed backend URL

### Validating Your Configuration

Run the environment validation script:
```bash
bun run check-env
```

This will:
- Check if `.env` file exists
- Validate all required variables are set
- Check minimum length requirements
- Warn about placeholder values

## Database Setup

### Understanding the Database

ScanStock uses:
- **SQLite**: Lightweight, file-based database
- **Prisma**: Type-safe ORM for database operations
- **Better Auth**: Authentication system

### Database Schema

The database includes these main models:
- `User`: User accounts
- `Session`: User sessions
- `Account`: OAuth accounts
- `InventoryItem`: Inventory items with metadata

### Database Commands

**View database GUI:**
```bash
bun run db:studio
# Opens Prisma Studio at http://localhost:5555
```

**Create new migration:**
```bash
bun run db:migrate
# Prompts for migration name
```

**Reset database (⚠️ destroys all data):**
```bash
bun run db:reset
```

**Apply migrations without creating new ones:**
```bash
cd server
bunx prisma migrate deploy
```

**Regenerate Prisma client:**
```bash
cd server
bunx prisma generate
```

## Running the Application

### Starting the Development Servers

You need **two terminal windows**:

**Terminal 1 - Backend Server:**
```bash
cd server
bun run dev
```

Expected output:
```
✅ Environment variables validated successfully
🔧 Initializing Hono application...
🚀 Server is running on port 3000
```

**Terminal 2 - Expo Development Server:**
```bash
bun start
```

### Opening the App

After starting Expo, you'll see a QR code and menu options:

**iOS Simulator (macOS only):**
- Press `i` in the terminal
- Requires Xcode to be installed

**Android Emulator:**
- Press `a` in the terminal
- Requires Android Studio and an emulator

**Web Browser:**
- Press `w` in the terminal
- Opens in your default browser

**Physical Device:**
1. Install Expo Go app on your phone
2. Scan the QR code shown in terminal
3. App will load on your device

## Troubleshooting

### Prerequisite Issues

#### "Bun is not installed"
**Problem:** The setup script or commands can't find Bun.

**Solution:**
1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Restart your terminal
3. Verify: `bun --version`

#### "Expo CLI not found"
**Problem:** Expo CLI is not available.

**Solution:**
```bash
# Install dependencies first
bun install
# Expo CLI is included in node_modules
# Use: bunx expo or npx expo
```

### Environment Issues

#### "BETTER_AUTH_SECRET must be at least 32 characters"
**Problem:** The auth secret is too short or missing.

**Solution:**
```bash
# Generate a new secret
openssl rand -base64 32

# Copy the output and paste it in server/.env
# BETTER_AUTH_SECRET="<paste here>"
```

#### "Environment variable validation failed"
**Problem:** Required environment variables are missing or invalid.

**Solution:**
1. Run: `bun run check-env` to see what's wrong
2. Fix the issues in `server/.env`
3. If `.env` is missing: `cp server/.env.example server/.env`

### Database Issues

#### "Database file not found"
**Problem:** The database hasn't been initialized.

**Solution:**
```bash
cd server
bunx prisma generate
bunx prisma migrate deploy
```

#### "Migration failed"
**Problem:** Database migration encountered an error.

**Solution:**
```bash
# Reset the database and start fresh
rm server/prisma/dev.db*
cd server
bunx prisma migrate deploy
```

#### "Prisma Client not generated"
**Problem:** The Prisma client hasn't been generated.

**Solution:**
```bash
cd server
bunx prisma generate
```

### Network Issues

#### "Port 3000 already in use"
**Problem:** Another application is using port 3000.

**Solution:**
1. Change the port in `server/.env`:
   ```
   PORT=3001
   ```
2. Update `BACKEND_URL` to match:
   ```
   BACKEND_URL="http://localhost:3001"
   ```

#### "Cannot connect to backend"
**Problem:** Frontend can't reach the backend server.

**Solution:**
1. Ensure backend is running: `cd server && bun run dev`
2. Check `BACKEND_URL` in `server/.env`
3. Verify the port matches what the server is running on

### Expo Issues

#### "Metro bundler not starting"
**Problem:** Expo dev server won't start.

**Solution:**
```bash
# Clear cache and restart
npx expo start --clear

# Or delete node_modules and reinstall
rm -rf node_modules
bun install
```

#### "Could not connect to development server"
**Problem:** Device/simulator can't connect to Expo.

**Solution:**
1. Ensure your device and computer are on the same network
2. Try tunnel mode: `bun start --tunnel`
3. Check firewall settings

## Common Issues

### Issue: Setup script fails
**Symptoms:** Setup script exits with errors

**Common causes:**
1. Bun not installed
2. Network issues preventing dependency downloads
3. Insufficient permissions

**Solutions:**
1. Install Bun and try again
2. Check internet connection
3. Run with appropriate permissions

### Issue: TypeScript errors
**Symptoms:** TypeScript type checking fails

**Solutions:**
```bash
# Regenerate Prisma client
cd server
bunx prisma generate

# Check for errors
bun run typecheck
```

### Issue: Changes not reflecting
**Symptoms:** Code changes don't appear in the app

**Solutions:**
1. Check that hot reload is working
2. Restart the dev server: `bun start --clear`
3. For backend: Ensure `bun run dev` is using `--hot` flag

### Issue: Authentication not working
**Symptoms:** Can't sign in or create account

**Solutions:**
1. Check `BETTER_AUTH_SECRET` is set in `.env`
2. Verify `BACKEND_URL` is correct
3. Check backend server logs for errors
4. Ensure database is initialized

## Getting Help

If you're still stuck after trying these solutions:

1. **Check the logs:**
   - Backend: Check console output from `bun run dev`
   - Frontend: Check Expo console output

2. **Validate your setup:**
   ```bash
   bun run check-env
   ```

3. **Create an issue:**
   - Include error messages
   - Describe steps to reproduce
   - Include your environment (OS, Bun version, etc.)

4. **Contact maintainers:**
   - Email: djhelectricalwork@gmail.com
   - Check the repository for contact info

---

**Remember:** The automated setup (`bun run setup`) handles most common issues automatically. Try it first! 🚀
