# Aurix Backend

Express.js backend for Aurix system with MongoDB integration.

## Setup

### Prerequisites
- Node.js 16+
- MongoDB Atlas account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
NODE_ENV=xxx
PORT=xxx
MONGO_URI=xxxxx
```

3. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Admin
- `POST /api/admin/login` - Login
- `GET /api/admin/me` - Get current admin
- `PATCH /api/admin/settings` - Update settings
- `POST /api/admin/logout` - Logout

### Devices
- `POST /api/device/register` - Register device
- `POST /api/device/heartbeat` - Device heartbeat
- `GET /api/devices` - List devices (requires auth)

### Logs
- `POST /api/log` - Create log entry
- `GET /api/log/device/:device_id` - Get device logs (requires auth)
- `GET /api/log/all` - Get all logs (requires auth)
- `GET /api/log/range` - Get logs by date range (requires auth)

### Health
- `GET /health` - Health check

## Default Admin
- Username: `xxxx`
- Password: `xxxxxx`

**Change this immediately in production!**

## MongoDB Collections

### devices
- device_id (unique)
- computer_name
- os_name
- version
- status (online/offline)
- last_seen

### users
- username (unique)
- email
- password_hash
- created_at
- updated_at

### logs
- device_id
- command
- status
- response
- created_at (auto-expires after 30 days)

### updates
- Device update information

## Logging

All user commands are automatically logged to the MongoDB `logs` collection with:
- device_id
- command
- status (success/error/info)
- response
- timestamp

Logs are automatically deleted after 30 days via MongoDB TTL index.
