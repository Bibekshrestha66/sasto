# Google OAuth Setup Guide

This guide explains how to set up Google OAuth for the Sasto Marketplace application.

## Overview

The application now supports universal Google Sign-In, similar to Gmail, YouTube, and other Google services. Users can sign in with their Google account in just one click.

## Prerequisites

1. A Google Cloud Project
2. Google OAuth 2.0 credentials (Client ID)
3. Environment variables configured

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000` (for local development)
   - `http://localhost:3000/auth/google/callback`
   - `https://yourdomain.com` (for production)
   - `https://yourdomain.com/auth/google/callback`
5. Copy the **Client ID** (you'll need this)

## Step 3: Configure Environment Variables

Add the following to your `.env` file:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_APP_URL=http://localhost:3000  # For local development
```

For production, update `VITE_APP_URL` to your actual domain:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_APP_URL=https://yourdomain.com
```

## Step 4: Test the Implementation

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to the login page:
   ```
   http://localhost:3000/login
   ```

3. Click the "Sign in with Google" button

4. You should see the Google Sign-In dialog

5. After signing in, you'll be redirected to the dashboard

## How It Works

### Frontend Flow

1. **GoogleSignIn Component** (`client/src/components/GoogleSignIn.tsx`):
   - Loads the Google Sign-In library
   - Renders the official Google Sign-In button
   - Handles the authentication callback

2. **Login Page** (`client/src/pages/LoginPage.tsx`):
   - Displays the Google Sign-In button
   - Provides fallback email/password login
   - Shows trust badges

### Backend Flow

1. **Google OAuth Router** (`server/routers/auth-google.ts`):
   - Verifies the JWT token from Google
   - Creates or updates user in the database
   - Returns a session token

2. **User Creation**:
   - Automatically creates a new user if they don't exist
   - Populates user profile from Google data (name, email, avatar)
   - Sets `verificationStatus` to "verified" (Google email is verified)

## Features

### Automatic User Profile Creation

When a user signs in with Google for the first time:
- User account is automatically created
- Profile picture is set from Google account
- Email is marked as verified
- User role is set to "user"

### Account Linking

Existing users can link their Google account to their profile:
- Allows seamless switching between login methods
- Preserves all user data and history

### Security

- JWT tokens are verified with Google's API
- Email addresses are verified by Google
- Session tokens are securely stored
- CSRF protection is enabled

## Troubleshooting

### "Failed to load Google Sign-In script"

**Solution**: Check that your Google Client ID is correct in the `.env` file.

### "Invalid token"

**Solution**: 
- Ensure the token is being sent correctly
- Check that the Google Client ID matches your project
- Verify that the redirect URI is whitelisted in Google Cloud Console

### "User creation failed"

**Solution**:
- Check that the database connection is working
- Verify that the users table exists and has the correct schema
- Check server logs for detailed error messages

### "Sign-In button not appearing"

**Solution**:
- Verify that `VITE_GOOGLE_CLIENT_ID` is set in your environment
- Check browser console for JavaScript errors
- Ensure the Google Sign-In script loaded successfully

## Production Deployment

1. Update your Google Cloud Console with production domain:
   - Add `https://yourdomain.com` to authorized origins
   - Add `https://yourdomain.com/auth/google/callback` to redirect URIs

2. Update environment variables:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_production_client_id
   VITE_APP_URL=https://yourdomain.com
   ```

3. Test the login flow on production

## API Reference

### GoogleSignIn Component

```tsx
<GoogleSignIn 
  onSuccess={(response) => console.log(response)}
  onError={(error) => console.error(error)}
  variant="button"
/>
```

**Props**:
- `onSuccess`: Callback when sign-in is successful
- `onError`: Callback when sign-in fails
- `variant`: "button" (default) or "popup"
- `className`: Additional CSS classes

### Backend Endpoint

**POST** `/api/trpc/auth.google.signIn`

**Request**:
```json
{
  "token": "google_jwt_token"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "avatar": "https://...",
    "role": "user"
  },
  "sessionToken": "jwt_session_token"
}
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google OAuth documentation: https://developers.google.com/identity/protocols/oauth2
3. Check server logs for detailed error messages
