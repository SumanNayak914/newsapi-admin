// Firebase Storage CORS set karne ka script
// Run: node set-cors.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const corsConfig = [
  {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://newsapi-nu.vercel.app",
      "https://newapiprovider.firebaseapp.com",
      "https://newapiprovider.web.app"
    ],
    method: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    responseHeader: [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "X-Requested-With"
    ],
    maxAgeSeconds: 3600
  }
];

// Check if service account file exists
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
} catch {
  console.error('❌ serviceAccountKey.json not found!');
  console.log('👉 Steps to get it:');
  console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('   2. Click "Generate new private key"');
  console.log('   3. Save as serviceAccountKey.json in this folder');
  console.log('   4. Run this script again: node set-cors.mjs');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'newapiprovider.firebasestorage.app'
});

const bucket = getStorage().bucket();

async function setCors() {
  try {
    await bucket.setCorsConfiguration(corsConfig);
    console.log('✅ CORS successfully applied to Firebase Storage!');
    console.log('👉 Now try uploading an image from your admin panel.');
  } catch (err) {
    console.error('❌ Error setting CORS:', err.message);
  }
}

setCors();
