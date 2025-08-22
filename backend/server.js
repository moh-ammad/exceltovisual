import express from 'express'
import cors from 'cors'
import helmet from 'helmet'


import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import connectTodb from './config/db.js'
import { authRoutes } from './routes/authRoutes.js'
import { userRoutes } from './routes/userRoutes.js'
import { taskRoutes } from './routes/taskRoutes.js'
import { reportRoutes } from './routes/reportRoutes.js'

dotenv.config()

const PORT = process.env.PORT || 5000
const app = express()


// // Allowed origins for CORS
// const allowedOrigins = [
//   'http://localhost:3000',
//   "https://exceltovisual.netlify.app"
// ]

// CORS middleware
app.use(cors({
  // origin: (origin, callback) => {
  //   if (!origin || allowedOrigins.includes(origin)) {
  //     callback(null, true)
  //   } else {
  //     callback(new Error('Not allowed by CORS'))
  //   }
  // },
  origin:process.env.CLIENT_URL||"*",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}))

if (process.env.NODE_ENV === 'production') {
  app.use(helmet()) // Full protection in production
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false // Relax CSP during development
    })
  )
}

// Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static uploads folder
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Connect to MongoDB
connectTodb()

// Routes
app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/reports', reportRoutes)

// CORS test route (optional)
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working!', origin: req.headers.origin })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})


