import express from 'express'
import cors from 'cors'
import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const distPath = path.join(__dirname, 'dist')

// CORS middleware to allow React app to communicate with backend
app.use(cors())
app.use(express.json())

// Default data storage location (can be overridden via DATA_PATH env variable)
const DEFAULT_DATA_DIR = path.join(__dirname, 'data')
const DATA_FILE_PATH = process.env.DATA_PATH || path.join(DEFAULT_DATA_DIR, 'tracker-data.json')

// Ensure data directory exists
async function ensureDataDirectory() {
  const dir = path.dirname(DATA_FILE_PATH)
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

// Read data from file
async function readData() {
  try {
    await ensureDataDirectory()
    const content = await fs.readFile(DATA_FILE_PATH, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return default structure
      return {
        monthKey: new Date().toISOString().slice(0, 7),
        tasks: [],
        completions: {},
      }
    }
    throw error
  }
}

// Write data to file
async function writeData(data) {
  await ensureDataDirectory()
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

// GET endpoint - retrieve all tracker data
app.get('/api/tracker', async (req, res) => {
  try {
    const data = await readData()
    res.json(data)
  } catch (error) {
    console.error('Error reading data:', error)
    res.status(500).json({ error: 'Failed to read tracker data' })
  }
})

// POST endpoint - save tracker data
app.post('/api/tracker', async (req, res) => {
  try {
    const { monthKey, tasks, completions } = req.body
    if (monthKey === undefined || !Array.isArray(tasks) || typeof completions !== 'object') {
      return res.status(400).json({ error: 'Invalid data format' })
    }
    const data = { monthKey, tasks, completions }
    await writeData(data)
    res.json({ success: true, message: 'Data saved successfully' })
  } catch (error) {
    console.error('Error writing data:', error)
    res.status(500).json({ error: 'Failed to save tracker data' })
  }
})

// GET endpoint - get data file path (for user info)
app.get('/api/info', (req, res) => {
  res.json({
    dataPath: DATA_FILE_PATH,
    message: `Data is stored at: ${DATA_FILE_PATH}`,
  })
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve built frontend (production / Render)
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`)
  console.log(`📁 Data storage location: ${DATA_FILE_PATH}`)
  if (existsSync(distPath)) {
    console.log('🌐 Serving frontend from dist/')
  } else {
    console.log('💡 Run "npm run dev" separately for the frontend (no dist/ folder found)')
  }
  console.log('✅ Server is ready to accept connections\n')
})

// Handle server errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})
