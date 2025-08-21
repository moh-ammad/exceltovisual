// import express from 'express'
// import cors from 'cors'
// import dotenv from 'dotenv'
// import path from 'path'
// import { fileURLToPath } from 'url'

// import connectTodb from './config/db.js'
// import { authRoutes } from './routes/authRoutes.js'
// import { userRoutes } from './routes/userRoutes.js'
// import { taskRoutes } from './routes/taskRoutes.js'
// import { reportRoutes } from './routes/reportRoutes.js'

// dotenv.config()

// const PORT = process.env.PORT || 5000
// const app = express()

// // ✅ Trust proxy (needed for platforms like Render)
// app.set('trust proxy', 1)

// // ✅ Define allowed origins
// const allowedOrigins = [
//   'http://localhost:3000',
//   'https://exceltovisual.netlify.app',
// ]

// // ✅ CORS middleware
// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   },
//   credentials: true,
// }))

// // Body parsing middleware
// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))

// // Static files
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// // Connect to MongoDB
// connectTodb()

// // Routes
// app.get('/', (req, res) => {
//   res.send('Backend is running')
// })

// app.use('/api/auth', authRoutes)
// app.use('/api/users', userRoutes)
// app.use('/api/tasks', taskRoutes)
// app.use('/api/reports', reportRoutes)

// // Test CORS route (Optional: for debugging)
// app.get('/api/test-cors', (req, res) => {
//   res.json({ message: 'CORS is working!', origin: req.headers.origin })
// })

// // Error listeners
// process.on('unhandledRejection', (err) => {
//   console.error('Unhandled Rejection:', err.message)
//   process.exit(1)
// })

// process.on('uncaughtException', (err) => {
//   console.error('Uncaught Exception:', err.message)
//   process.exit(1)
// })

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`)
// })
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

dotenv.config()

const PORT = process.env.PORT || 5000
const app = express()

// ✅ Trust proxy (needed for platforms like Render)
app.set('trust proxy', 1)

// ✅ TEMP: Allow all origins (for testing only — not for production)
app.use(cors({
  origin: '*', // Allow all origins
}))

// ✅ Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ✅ Static files
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ✅ Connect to MongoDB
connectTodb()

// ✅ Routes
app.get('/', (req, res) => {
  res.send('Backend is running')
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/reports', reportRoutes)

// ✅ Optional CORS Test Route
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working!', origin: req.headers.origin })
})

// ✅ Error listeners
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message)
  process.exit(1)
})

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
