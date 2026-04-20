# WeatherApp - Hourly Weather SMS Broadcast System

A complete weather alert system that sends SMS updates to subscribers via Twilio. Includes an admin panel for managing consumers and broadcasting weather updates.

---

## 📁 Folder Structure

```
WeatherApp/
├── backend/
│   ├── server.js          # Main backend server
│   └── package.json       # Node.js dependencies
├── frontend/
│   ├── admin/
│   │   └── index.html     # Admin Panel
│   └── user/
│       └── index.html     # Consumer Registration Portal
├── data/
│   └── weather.db         # SQLite database (auto-created)
├── START_SERVER.bat       # Windows batch file to start server
└── README.md              # This file
```

---

## 🚀 Quick Start

### Step 1: Install Node.js
- Download from https://nodejs.org (LTS version v20 or later)
- Verify: Run `node --version` in terminal/command prompt

### Step 2: Install Dependencies

```bash
# Navigate to backend folder
cd WeatherApp/backend

# Install dependencies
npm install

# Create environment file (copy from example)
cp .env.example .env
```

### Step 3: Configure Twilio (for SMS)

Edit the `.env` file in the `backend` folder with your Twilio credentials:

```env
TWILIO_SID=ACxxxxxxxxxxxxxxxx
TWILIO_TOKEN=your_auth_token
TWILIO_FROM=+1234567890
```

Get free credentials from https://www.twilio.com

### Step 4: Start the Server

```bash
# From backend folder
node server.js
```

Or use the startup scripts:
- **Windows:** Double-click `START_SERVER.bat`
- **Linux/Mac:** Run `bash START_SERVER.sh`

### Step 5: Access the App

Open your browser:
- **Admin Panel:** http://localhost:3001/admin
- **User Portal:** http://localhost:3001/user

---

## ⚡ Quick Commands Reference

```bash
# Install dependencies
cd backend && npm install

# Start server
cd backend && node server.js

# Or use scripts
./START_SERVER.sh    # Linux/Mac
START_SERVER.bat     # Windows
```

---

## 🔐 Default Login

- **Email:** admin@weather.app
- **Password:** admin123

> ⚠️ Change your password immediately after first login!

---

## 📖 How to Use

### Sending Weather Updates
1. Login to Admin Panel
2. Go to "Broadcast SMS"
3. Type your weather message
4. Click "Send to all subscribers"

### Managing Consumers
- **Add manually:** Admin Panel → Consumers → Add New Consumer
- **User self-register:** Share the User Portal URL

### Export Data
Admin Panel → Consumers → Export CSV

---

## 🔧 Troubleshooting

| Error | Solution |
|-------|----------|
| "Cannot find module 'better-sqlite3'" | Run `npm install` in backend folder |
| "Port 3001 already in use" | Change PORT in server.js to 3002 |
| SMS not sending | Verify Twilio credentials and account balance |
| "Cannot connect" | Make sure server is running (`node server.js`) |

### For Indian Phone Numbers
Use format: +91XXXXXXXXXX (10 digits after +91)

---

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **SMS:** Twilio API
- **Auth:** JWT + bcrypt
- **Frontend:** Pure HTML + CSS + JavaScript

---

## 📄 License

MIT License