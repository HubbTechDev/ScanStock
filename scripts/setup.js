#!/usr/bin/env node

/**
 * ScanStock Setup Script
 * 
 * This script automates the setup process for the ScanStock application.
 * It checks prerequisites, installs dependencies, sets up environment variables,
 * and initializes the database.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Helper functions for colored output
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`),
};

// Execute command and return output
function exec(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

// Check if a command exists
function commandExists(command) {
  try {
    const result = exec(`which ${command}`, { silent: true, ignoreError: true });
    return result !== null && result.trim() !== '';
  } catch {
    return false;
  }
}

// Check if Bun is installed
function checkBun() {
  log.step('Checking for Bun...');
  if (!commandExists('bun')) {
    log.error('Bun is not installed!');
    log.info('Bun is required to run this application.');
    log.info('Install Bun from: https://bun.sh');
    log.info('Run: curl -fsSL https://bun.sh/install | bash');
    return false;
  }
  try {
    const version = exec('bun --version', { silent: true, ignoreError: false }).trim();
    log.success(`Bun is installed (version ${version})`);
    return true;
  } catch (error) {
    log.error('Bun is not installed or not working properly!');
    log.info('Install Bun from: https://bun.sh');
    return false;
  }
}

// Check if Expo CLI is available
function checkExpo() {
  log.step('Checking for Expo CLI...');
  
  // Check if expo is available globally
  if (commandExists('expo')) {
    const version = exec('expo --version', { silent: true, ignoreError: true });
    if (version) {
      log.success(`Expo CLI is installed globally (version ${version.trim()})`);
      return true;
    }
  }
  
  // Check if expo is available via npx
  try {
    exec('npx expo --version', { silent: true, ignoreError: true });
    log.success('Expo CLI is available via npx');
    return true;
  } catch {
    log.warning('Expo CLI not found globally, but will be available after installing dependencies');
    return true; // We'll install it with dependencies
  }
}

// Install frontend dependencies
function installFrontendDependencies() {
  log.step('Installing frontend dependencies...');
  exec('bun install');
  log.success('Frontend dependencies installed');
}

// Install backend dependencies
function installBackendDependencies() {
  log.step('Installing backend dependencies...');
  process.chdir('server');
  exec('bun install');
  process.chdir('..');
  log.success('Backend dependencies installed');
}

// Generate a random secret key
function generateSecret() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64');
}

// Setup environment file
function setupEnvironment() {
  log.step('Setting up environment variables...');
  
  const envPath = path.join(__dirname, '..', 'server', '.env');
  const envExamplePath = path.join(__dirname, '..', 'server', '.env.example');
  
  if (fs.existsSync(envPath)) {
    log.warning('.env file already exists in server directory');
    log.info('Skipping environment file creation');
    return;
  }
  
  if (!fs.existsSync(envExamplePath)) {
    log.error('.env.example file not found!');
    log.info('Please create a .env file manually in the server directory');
    return;
  }
  
  // Read the example file
  let envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  // Generate a random secret
  const secret = generateSecret();
  
  // Replace the placeholder secret with a real one
  envContent = envContent.replace(
    'BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters-long-replace-me"',
    `BETTER_AUTH_SECRET="${secret}"`
  );
  
  // Write the .env file
  fs.writeFileSync(envPath, envContent);
  log.success('.env file created in server directory with generated BETTER_AUTH_SECRET');
  log.info('You can edit server/.env to customize settings');
}

// Initialize database
function initializeDatabase() {
  log.step('Initializing database...');
  
  process.chdir('server');
  
  const dbPath = path.join(__dirname, '..', 'server', 'prisma', 'dev.db');
  
  // Check if database already exists
  if (fs.existsSync(dbPath)) {
    log.warning('Database already exists');
    log.info('Skipping database initialization');
    log.info('To reset the database, delete server/prisma/dev.db and run setup again');
    process.chdir('..');
    return;
  }
  
  try {
    // Generate Prisma client
    log.info('Generating Prisma client...');
    exec('bunx prisma generate');
    
    // Run migrations
    log.info('Running database migrations...');
    exec('bunx prisma migrate deploy');
    
    log.success('Database initialized successfully');
  } catch (error) {
    log.error('Failed to initialize database');
    log.error('You may need to run the following commands manually:');
    log.info('  cd server');
    log.info('  bunx prisma generate');
    log.info('  bunx prisma migrate deploy');
  } finally {
    process.chdir('..');
  }
}

// Print next steps
function printNextSteps() {
  log.header('🎉 Setup Complete!');
  console.log('Your ScanStock app is ready to run.\n');
  console.log('Next steps:\n');
  console.log('1. Start the backend server:');
  console.log(`   ${colors.cyan}cd server && bun run dev${colors.reset}\n`);
  console.log('2. In a new terminal, start the Expo app:');
  console.log(`   ${colors.cyan}bun start${colors.reset}\n`);
  console.log('3. Follow the Expo instructions to:');
  console.log('   - Press "i" for iOS simulator');
  console.log('   - Press "a" for Android emulator');
  console.log('   - Press "w" for web browser');
  console.log('   - Scan QR code with Expo Go app\n');
  console.log('For more information, see the README.md file.\n');
}

// Main setup function
async function main() {
  console.log(`
╔═══════════════════════════════════════╗
║   🏗️  ScanStock Setup Assistant      ║
╚═══════════════════════════════════════╝
`);

  log.info('This script will help you set up ScanStock for local development.');
  log.info('It will check prerequisites, install dependencies, and initialize the database.\n');
  
  try {
    // Step 1: Check prerequisites
    log.header('Step 1: Checking Prerequisites');
    const bunInstalled = checkBun();
    if (!bunInstalled) {
      log.error('Setup cannot continue without Bun. Please install Bun and try again.');
      process.exit(1);
    }
    checkExpo();
    
    // Step 2: Install dependencies
    log.header('Step 2: Installing Dependencies');
    installFrontendDependencies();
    installBackendDependencies();
    
    // Step 3: Setup environment
    log.header('Step 3: Setting Up Environment');
    setupEnvironment();
    
    // Step 4: Initialize database
    log.header('Step 4: Initializing Database');
    initializeDatabase();
    
    // Print next steps
    printNextSteps();
    
  } catch (error) {
    log.error('Setup failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the setup
main();
