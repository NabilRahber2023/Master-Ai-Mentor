#!/usr/bin/env node
/**
 * Create test user using Better Auth API
 * This ensures the user is created through the proper authentication flow
 */
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/auth';
const email = 'test@aimentor.local';
const password = 'TestPassword123!';
const name = 'Test User';

async function createTestUser() {
  console.log('🚀 Creating test user via Better Auth API...\n');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Name:     ${name}\n`);

  try {
    // Check if user already exists
    console.log('Checking if user already exists...');
    
    // Try to sign in first to see if user exists
    const signInRes = await fetch(`${API_URL}/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (signInRes.ok) {
      console.log('✓ User already exists and password works!\n');
      const data = await signInRes.json();
      console.log('Session created:', data.session?.id || 'ok');
      return;
    }

    // If user doesn't exist, create new account
    console.log('\nCreating new user via sign-up...');
    
    const signUpRes = await fetch(`${API_URL}/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });

    if (!signUpRes.ok) {
      const error = await signUpRes.text();
      console.error('❌ Sign-up failed:');
      console.error(`Status: ${signUpRes.status}`);
      console.error(`Error: ${error}`);
      return;
    }

    const userData = await signUpRes.json();
    console.log('✓ User created successfully!');
    console.log(`User ID: ${userData.user?.id || 'unknown'}`);
    
    // Try to sign in immediately
    console.log('\nVerifying login works...');
    const verifyRes = await fetch(`${API_URL}/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (verifyRes.ok) {
      console.log('✓ Login verification passed!\n');
      console.log('='.repeat(50));
      console.log('✨ TEST USER READY');
      console.log(`📧 Email:    ${email}`);
      console.log(`🔐 Password: ${password}`);
      console.log('='.repeat(50));
    } else {
      const verifyError = await verifyRes.text();
      console.error('❌ Login verification failed:');
      console.error(verifyError);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure frontend is running on port 3000');
    console.log('2. Check DATABASE_URL environment variable');
    console.log('3. Verify PostgreSQL is running on port 5433');
  }
}

createTestUser();
