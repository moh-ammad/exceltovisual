import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import connectTodb from './config/db.js'
import { authRoutes } from './routes/authRoutes.js'
import { userRoutes } from './routes/userRoutes.js'
import { taskRoutes } from './routes/taskRoutes.js'
import { reportRoutes } from './routes/reportRoutes.js'

// Load env variables
dotenv.config()

// App setup
const app = express()
const PORT = process.env.PORT || 5000

// Get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static uploads folder if used
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ✅ CORS Configuration
const allowedOrigins = [
  'https://exceltovisual.netlify.app',
  'http://localhost:3000',
]

// CORS options object
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}

// Enable CORS with options
app.use(cors(corsOptions))

// ✅ Handle preflight requests
app.options('*', cors(corsOptions))

// ✅ Connect to DB
connectTodb()

// Routes
app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/reports', reportRoutes)

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`)
})
