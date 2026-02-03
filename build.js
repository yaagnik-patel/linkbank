#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing LinkBank for EAS Build...\n');

// Clean node_modules if needed
if (fs.existsSync('node_modules')) {
  console.log('📦 Cleaning node_modules...');
  try {
    execSync('npm run clean', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Clean command failed, continuing...');
  }
}

// Install dependencies
console.log('\n📥 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Run EAS build
console.log('\n🚀 Starting EAS Android build...');
try {
  execSync('eas build --platform android --profile preview', { stdio: 'inherit' });
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('\n❌ Build failed');
  process.exit(1);
}
