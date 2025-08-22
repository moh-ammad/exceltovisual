import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectTodb from './config/db.js';
import { authRoutes } from './routes/authRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { taskRoutes } from './routes/taskRoutes.js';
import { reportRoutes } from './routes/reportRoutes.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// ✅ Allowed origins for CORS
const allowedOrigins = [
  process.env.CLIENT_URL,           // Frontend in prod
  'http://localhost:3000',          // Local dev
];

// CORS middleware
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply CORS middleware globally
app.use(cors(corsOptions));

// Explicitly handle preflight OPTIONS requests per route
app.options('/api/auth', cors(corsOptions));
app.options('/api/users', cors(corsOptions));
app.options('/api/tasks', cors(corsOptions));
app.options('/api/reports', cors(corsOptions));

// Helmet setup
if (process.env.NODE_ENV === 'production') {
  app.use(helmet()); // full protection
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false, // relaxed for dev
    })
  );
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to DB
connectTodb();

// Routes
app.get('/', (req, res) => res.send('Backend is running'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);

// Optional CORS test route
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working!', origin: req.headers.origin });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
