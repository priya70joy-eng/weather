===================================================
  WeatherApp — Complete Setup Guide
  Hourly Weather SMS Broadcast System
===================================================

📁 FOLDER STRUCTURE (save this folder to D:\WeatherApp)
--------------------------------------------------------
WeatherApp/
├── backend/
│   ├── server.js          ← Main backend server
│   └── package.json       ← Node.js dependencies
├── frontend/
│   ├── admin/
│   │   └── index.html     ← Admin Panel (your control panel)
│   └── user/
│       └── index.html     ← Consumer Registration Portal
├── data/
│   └── weather.db         ← Auto-created SQLite database
└── README.txt             ← This file


===================================================
  STEP 1 — INSTALL NODE.JS
===================================================
1. Go to: https://nodejs.org
2. Download and install Node.js LTS (v20 or later)
3. After install, open Command Prompt (Win+R → type "cmd")
4. Type:  node --version
   You should see something like:  v20.x.x


===================================================
  STEP 2 — INSTALL DEPENDENCIES
===================================================
1. Open Command Prompt
2. Navigate to backend folder:
     cd D:\WeatherApp\backend
3. Run:
     npm install
4. Wait for all packages to install (takes ~1 minute)


===================================================
  STEP 3 — SET UP TWILIO (for real SMS)
===================================================
1. Go to: https://www.twilio.com and create a free account
2. From your Twilio Dashboard, copy:
   - Account SID  (starts with AC...)
   - Auth Token
   - Your Twilio phone number

3. Edit D:\WeatherApp\backend\server.js
   Find these lines near the top and fill in your details:
     const TWILIO_SID   = 'ACxxxxxxxxxxxxxxxx';
     const TWILIO_TOKEN = 'your_auth_token';
     const TWILIO_FROM  = '+1234567890';

   OR create a .env file in the backend folder:
     TWILIO_SID=ACxxxxxxxxxxxxxxxx
     TWILIO_TOKEN=your_auth_token
     TWILIO_FROM=+1234567890

   NOTE: For Indian numbers (Vodafone/Airtel/Jio), use the
   +91XXXXXXXXXX format for consumer phone numbers.


===================================================
  STEP 4 — START THE SERVER
===================================================
1. Open Command Prompt
2. Run:
     cd D:\WeatherApp\backend
     node server.js

3. You should see:
     🌤  WeatherApp Server running at http://localhost:3001
        Admin panel : http://localhost:3001/admin
        User portal : http://localhost:3001/user

4. Keep this window open! (Server stops if you close it)

   TIP: To auto-start on boot:
     npm install -g pm2
     pm2 start server.js
     pm2 startup


===================================================
  STEP 5 — ACCESS THE PANELS
===================================================

ADMIN PANEL (Your Control Panel):
  URL:      http://localhost:3001/admin
  Email:    admin@weather.app
  Password: admin123

  What you can do:
  ✅ Add your own phone number (My Profile)
  ✅ Add consumer numbers manually
  ✅ Write weather updates and broadcast to all
  ✅ Toggle hourly/morning/severe alert SMS on/off
  ✅ View all consumers and broadcast history
  ✅ Export consumer list as Excel/CSV

CONSUMER REGISTRATION PORTAL:
  URL:      http://localhost:3001/user
  Share this link so people can register themselves!
  Their numbers auto-appear in your Admin → Consumers list.


===================================================
  STEP 6 — CHANGE YOUR ADMIN PASSWORD
===================================================
1. Log in to Admin Panel
2. Click "My Profile" in sidebar
3. Enter current password: admin123
4. Set your new strong password
5. Save!


===================================================
  HOW TO SEND A WEATHER UPDATE
===================================================
1. Log in to Admin Panel → http://localhost:3001/admin
2. Click "Broadcast SMS" in sidebar
3. Type your weather update message, e.g.:
   "Today in Kolkata: 34°C, partly cloudy, evening rain 5-8 PM. Humidity 72%. Stay hydrated!"
4. Click "Send to all subscribers"
5. SMS goes to ALL active consumer numbers via Twilio


===================================================
  HOW CONSUMERS REGISTER
===================================================
Option A — They register themselves:
  1. Share the URL: http://localhost:3001/user
  2. They fill name, phone, area + CAPTCHA
  3. They appear instantly in your Admin → Consumers list

Option B — You add them manually:
  1. Admin Panel → Consumers
  2. Fill the "Add New Consumer" form
  3. Click "Add Consumer"


===================================================
  EXPORT TO EXCEL
===================================================
1. Admin Panel → Consumers
2. Click "Export CSV" button
3. Open the downloaded file in Microsoft Excel
4. All consumer data: Name, Phone, Email, Location, Status


===================================================
  TROUBLESHOOTING
===================================================

Error: "Cannot find module 'better-sqlite3'"
→ Run: npm install  (in the backend folder)

Error: "Port 3001 already in use"
→ Change PORT=3001 to PORT=3002 in server.js

SMS not sending?
→ Check your Twilio credentials in server.js
→ Make sure Twilio account is funded (₹ or $)
→ For Indian numbers: format must be +91XXXXXXXXXX

Admin panel shows "Cannot connect"?
→ Make sure server.js is running (node server.js)
→ Check http://localhost:3001 in browser


===================================================
  TECH STACK SUMMARY
===================================================
Backend:   Node.js + Express
Database:  SQLite (file: data/weather.db)
SMS:       Twilio API
Auth:      JWT tokens + bcrypt password hashing
Security:  CAPTCHA on all login/register forms
Frontend:  Pure HTML + CSS + JS (no framework)


===================================================
  SUPPORT
===================================================
Default Admin Login:
  Email:    admin@weather.app
  Password: admin123  ← CHANGE THIS IMMEDIATELY!

For Twilio help: https://www.twilio.com/docs/sms
For Node.js help: https://nodejs.org/docs
===================================================
