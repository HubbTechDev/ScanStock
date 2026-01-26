# Contributing to ScanStock

Thank you for your interest in contributing to ScanStock! This guide will help you get started with development.

## 🚀 Quick Start for Contributors

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/ScanStock.git
cd ScanStock
```

### 2. Run Setup

```bash
# Use the automated setup script
bun run setup
```

This will:
- Check prerequisites (Bun)
- Install all dependencies
- Create `.env` file with generated secrets
- Initialize the database

### 3. Start Development

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
bun run dev
```

**Terminal 2 - Frontend:**
```bash
bun start
```

## 📋 Development Workflow

### Making Changes

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test them thoroughly

3. Commit your changes with clear, descriptive messages:
   ```bash
   git add .
   git commit -m "Add feature: description of your changes"
   ```

4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request on GitHub

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and conventions
- Run type checking before committing:
  ```bash
  bun run typecheck
  ```

### Database Changes

If you need to modify the database schema:

1. Edit `server/prisma/schema.prisma`
2. Create a migration:
   ```bash
   cd server
   bunx prisma migrate dev --name description_of_change
   ```
3. Commit both the schema and migration files

### Testing Your Changes

Before submitting a PR:

1. Test the frontend on multiple platforms (iOS, Android, Web if possible)
2. Test all affected API endpoints
3. Ensure type checking passes: `bun run typecheck`
4. Check that the database migrations work correctly

## 🛠️ Useful Commands

### Setup & Configuration
- `bun run setup` - Initial project setup
- `bun run check-env` - Validate environment variables

### Development
- `bun start` - Start Expo dev server
- `bun run server:dev` - Start backend server
- `bun run typecheck` - Type check all TypeScript

### Database
- `bun run db:migrate` - Create and apply migration
- `bun run db:studio` - Open Prisma Studio GUI
- `bun run db:reset` - Reset database (⚠️ deletes all data)

### Platform-Specific
- `bun run ios` - Open on iOS simulator
- `bun run android` - Open on Android emulator
- `bun run web` - Open in web browser

## 🐛 Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, Bun version, etc.)

## 💡 Feature Requests

We welcome feature requests! Please:

- Check if the feature has already been requested
- Clearly describe the feature and its benefits
- Provide examples or mockups if possible

## 📖 Project Structure

```
ScanStock/
├── src/                    # Frontend Expo app
│   ├── app/               # Expo Router routes
│   ├── components/        # Reusable UI components
│   └── lib/              # Utilities and hooks
├── server/                # Backend server
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── auth.ts       # Authentication
│   │   └── index.ts      # Server entry
│   └── prisma/           # Database schema & migrations
├── shared/               # Code shared between app and server
└── scripts/             # Development and setup scripts
```

## 🤝 Code Review Process

All contributions require code review. We look for:

- Code quality and readability
- Proper error handling
- Type safety
- Consistent style with existing code
- Clear commit messages
- Updated documentation when needed

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## ❓ Questions?

If you have questions about contributing:

- Check the [README.md](README.md) for general documentation
- Look through existing issues and pull requests
- Reach out to the maintainers

Thank you for contributing to ScanStock! 🎉
