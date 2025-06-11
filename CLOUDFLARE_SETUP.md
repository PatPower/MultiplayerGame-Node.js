# Cloudflare Zero Trust Authentication Setup

This guide explains how to configure Cloudflare Zero Trust authentication for the multiplayer game.

## Prerequisites

1. A Cloudflare account with Zero Trust enabled
2. A domain managed by Cloudflare
3. Node.js application deployed and accessible

## Cloudflare Zero Trust Configuration

### 1. Create an Application in Cloudflare Zero Trust

1. Log into the Cloudflare dashboard
2. Go to Zero Trust > Access > Applications
3. Click "Add an application"
4. Choose "Self-hosted" application type
5. Configure the application:
   - **Application name**: Patland Game
   - **Subdomain**: patland (or your preferred subdomain)
   - **Domain**: your-domain.com
   - **Path**: Leave empty for entire application

### 2. Configure Authentication Methods

1. In the application settings, go to "Authentication"
2. Add your preferred identity providers:
   - Google Workspace
   - Microsoft Azure AD
   - GitHub
   - Or any other supported provider

### 3. Create Access Policies

1. Go to "Policies" tab in your application
2. Create a policy to allow access:
   - **Policy name**: Allow Game Access
   - **Action**: Allow
   - **Rules**: Configure based on your requirements (e.g., specific email domains, groups, etc.)

### 4. Get Application Configuration

1. In your application settings, note down:
   - **Application Audience (AUD)**: Found in the application overview
   - **Team domain**: your-team-name.cloudflareaccess.com

## Environment Configuration

Update your `.env` file with the Cloudflare configuration:

```env
# Cloudflare Zero Trust Configuration
CLOUDFLARE_TEAM_DOMAIN=your-team-name.cloudflareaccess.com
CLOUDFLARE_POLICY_AUD=your-application-aud-from-cloudflare
CLOUDFLARE_CERTS_URL=https://your-team-name.cloudflareaccess.com/cdn-cgi/access/certs

# Database Configuration
DATABASE_TYPE=json
DATABASE_PATH=./data/players.json

# JWT Secret for session management
JWT_SECRET=your-secure-random-jwt-secret

# Server Configuration
PORT=80
```

## Features Implemented

### Authentication Features
- ✅ Cloudflare Zero Trust JWT verification
- ✅ Automatic user authentication on page load
- ✅ Socket.io connection authentication
- ✅ User identity management (email, name, unique ID)

### Persistent Storage Features
- ✅ Player inventory persistence across sessions
- ✅ Player position saving and restoration
- ✅ Skill progression tracking
- ✅ Automatic save on inventory changes
- ✅ Automatic save on player movement
- ✅ JSON file-based storage (easily replaceable with database)

### Game Integration
- ✅ Seamless authentication without disrupting gameplay
- ✅ User display in game interface
- ✅ Authenticated user name in game
- ✅ Secure player data management

## How It Works

1. **User Access**: When a user visits the game URL, Cloudflare Zero Trust intercepts the request
2. **Authentication**: User is redirected to configured identity provider if not authenticated
3. **JWT Generation**: Cloudflare generates a JWT token containing user information
4. **Game Access**: Authenticated users access the game with JWT in headers
5. **Server Verification**: Game server verifies JWT against Cloudflare's public keys
6. **Player Creation/Loading**: Server creates new player or loads existing player data from database
7. **Persistent Storage**: All game progress (inventory, position, skills) is automatically saved

## Testing Without Cloudflare

For development/testing without Cloudflare Zero Trust:

1. Set environment variables to dummy values
2. The authentication middleware will need to be bypassed or mocked
3. Consider creating a development mode that skips authentication

## Database Migration

The current implementation uses JSON file storage. To migrate to a proper database:

1. Implement new database adapter in `app/database.js`
2. Update the Database class methods to use your preferred database (MongoDB, PostgreSQL, etc.)
3. No changes needed in other parts of the application

## Security Notes

- JWT tokens are verified against Cloudflare's public keys
- User sessions are managed securely
- Player data is isolated by authenticated user ID
- All database operations are tied to authenticated users

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Check Cloudflare application configuration and environment variables
2. **Database Errors**: Ensure `data/` directory exists and is writable
3. **Connection Issues**: Verify JWT token is being passed correctly in socket connection

### Logs to Check

- Server console for authentication errors
- Browser console for client-side authentication issues
- Cloudflare Access logs for policy violations