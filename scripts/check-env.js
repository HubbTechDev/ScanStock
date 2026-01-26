#!/usr/bin/env node

/**
 * Check Environment Script
 * 
 * This script validates that all environment variables are set correctly.
 * Run this to troubleshoot environment configuration issues.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

console.log(`\n${colors.cyan}╔════════════════════════════════════════╗`);
console.log(`║  🔍 Environment Configuration Check   ║`);
console.log(`╚════════════════════════════════════════╝${colors.reset}\n`);

const serverDir = path.join(__dirname, '..', 'server');
const envPath = path.join(serverDir, '.env');
const envExamplePath = path.join(serverDir, '.env.example');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log(`${colors.red}✗${colors.reset} .env file not found at: ${envPath}`);
  
  if (fs.existsSync(envExamplePath)) {
    console.log(`${colors.yellow}ℹ${colors.reset} .env.example file exists. Copy it to create .env:`);
    console.log(`  ${colors.cyan}cp server/.env.example server/.env${colors.reset}`);
  } else {
    console.log(`${colors.red}✗${colors.reset} .env.example file also not found!`);
  }
  
  console.log(`\n${colors.yellow}Run the setup script to create the environment file:${colors.reset}`);
  console.log(`  ${colors.cyan}bun run setup${colors.reset}\n`);
  process.exit(1);
}

console.log(`${colors.green}✓${colors.reset} .env file found\n`);

// Read and parse .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    if (key) {
      envVars[key.trim()] = value.trim();
    }
  }
});

// Required variables
const requiredVars = [
  { name: 'DATABASE_URL', minLength: 1 },
  { name: 'BETTER_AUTH_SECRET', minLength: 32 },
  { name: 'BACKEND_URL', minLength: 1 },
];

// Optional variables
const optionalVars = [
  'PORT',
  'NODE_ENV',
];

let allValid = true;

console.log('Required variables:');
requiredVars.forEach(({ name, minLength }) => {
  const value = envVars[name];
  
  if (!value) {
    console.log(`  ${colors.red}✗${colors.reset} ${name}: Not set`);
    allValid = false;
  } else if (value.length < minLength) {
    console.log(`  ${colors.red}✗${colors.reset} ${name}: Too short (${value.length} chars, need ${minLength}+)`);
    allValid = false;
  } else if (value.includes('replace-me') || value.includes('your-') || value.includes('at-least-32')) {
    console.log(`  ${colors.yellow}⚠${colors.reset} ${name}: Still using placeholder value`);
    console.log(`    ${colors.yellow}Generate a new value with: openssl rand -base64 32${colors.reset}`);
    allValid = false;
  } else {
    console.log(`  ${colors.green}✓${colors.reset} ${name}: Set (${value.substring(0, 20)}...)`);
  }
});

console.log('\nOptional variables:');
optionalVars.forEach(name => {
  const value = envVars[name];
  if (value) {
    console.log(`  ${colors.green}✓${colors.reset} ${name}: ${value}`);
  } else {
    console.log(`  ${colors.blue}ℹ${colors.reset} ${name}: Using default value`);
  }
});

if (allValid) {
  console.log(`\n${colors.green}✓ All required environment variables are properly configured!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}✗ Some environment variables need attention.${colors.reset}`);
  console.log(`${colors.yellow}Fix the issues above and try again.${colors.reset}\n`);
  process.exit(1);
}
