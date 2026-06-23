# Monthly To-Do Tracker

A React-based monthly task tracker that stores data in a local file on your device.

## Features

- ✅ Add and remove tasks dynamically
- ✅ Track daily task completion with checkboxes
- ✅ Visual charts showing daily completion trends
- ✅ Monthly completion statistics
- ✅ Data stored in a JSON file on your local device (not in browser storage)
- ✅ CSV export functionality
- ✅ Reset month tracking (keeps tasks, clears completion data)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**

   **Option A - Easy Start (Windows):**
   - Double-click `start.bat` (or `start.ps1` for PowerShell)
   - This will open two windows: one for the backend server and one for the frontend

   **Option B - Manual Start:**
   
   First, start the backend server:
   ```bash
   npm run dev:server
   ```
   The server will run on `http://localhost:3001` and store data in `data/tracker-data.json` by default.
   
   Then, in a **separate terminal**, start the React frontend:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (or the port Vite assigns).

   **Option C - Run both together:**
   ```bash
   npm run dev:all
   ```

## Important Notes

⚠️ **The backend server MUST be running before you open the app in your browser!**

- If you see "Failed to connect to backend server", make sure:
  1. The backend server is running (check for the terminal showing "🚀 Backend server running")
  2. The server is on port 3001 (check the terminal output)
  3. No other application is using port 3001
  4. Your firewall isn't blocking the connection

## Data Storage Location

By default, data is stored in `data/tracker-data.json` relative to the project root.

To change the storage location, set the `DATA_PATH` environment variable:

**Windows (PowerShell):**
```powershell
$env:DATA_PATH="C:\Users\YourName\Documents\tracker-data.json"
npm run dev:server
```

**Windows (CMD):**
```cmd
set DATA_PATH=C:\Users\YourName\Documents\tracker-data.json
npm run dev:server
```

**Linux/Mac:**
```bash
DATA_PATH=/home/username/documents/tracker-data.json npm run dev:server
```

## API Endpoints

- `GET /api/tracker` - Retrieve all tracker data
- `POST /api/tracker` - Save tracker data
- `GET /api/info` - Get data file path information
- `GET /api/health` - Health check endpoint

## Project Structure

```
tracker/
├── server.js          # Express backend server
├── config.json        # Configuration file
├── data/              # Data storage directory (created automatically)
│   └── tracker-data.json
├── src/
│   ├── App.jsx        # Main React component
│   ├── App.css        # Styles
│   └── main.jsx       # React entry point
└── package.json
```

## Notes

- The backend server must be running for the app to work
- Data persists across browser sessions and page reloads
- Tasks persist until manually removed (even across months)
- The "Reset Month" button only clears completion tracking, not tasks
