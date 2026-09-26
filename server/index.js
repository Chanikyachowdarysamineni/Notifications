require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const notificationLogRoutes = require('./routes/notificationLogRoutes');
const eventRoutes = require('./routes/eventRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const fileRoutes = require('./routes/fileRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const academicRoutes = require('./routes/academicRoutes');
const searchRoutes = require('./routes/searchRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const systemSettingsRoutes = require('./routes/systemSettingsRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Helmet Configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"], // Add any other external image domains
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.cloudinary.com", "https://fcm.googleapis.com"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));
app.disable('x-powered-by'); // extra precaution

const { globalLimiter, readLimiter, writeLimiter, uploadLimiter } = require('./middleware/rateLimiters');
app.use(globalLimiter);

// Dynamic method-based rate limiters (skip auth as it has custom ones)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) return next();
  if (req.path.includes('/upload') || req.path.includes('/files')) {
    return uploadLimiter(req, res, next);
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  if (req.method === 'GET') {
    return readLimiter(req, res, next);
  }
  next();
});

// Security: Enforce CORS to trust only the frontend URL from environment
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://192.168.') || origin.startsWith('http://10.')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const initCronJobs = require('./cron/index');

// Security: Fail fast if database credentials are not provided
if (!process.env.MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in environment variables.');
  process.exit(1);
}

// Database Connection
mongoose.connect(process.env.MONGO_URI, { maxPoolSize: 200 })
.then(() => {
  console.log('MongoDB Connected');
  initCronJobs(); // Start cron jobs
})
  .catch(err => {
    console.log('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api', academicRoutes); // mounts /api/years and /api/sections
app.use('/api/search', searchRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/admin/notification-log', notificationLogRoutes);
app.use('/api/system-settings', systemSettingsRoutes);

// Basic route to test server
app.get('/api/status', (req, res) => {
  res.json({ status: 'success', message: 'MERN Server is running securely!' });
});

// Health Check Endpoint (Production standard)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting', 99: 'uninitialized' };
  
  const status = dbState === 1 ? 200 : 503;
  res.status(status).json({
    status: dbState === 1 ? 'healthy' : 'degraded',
    database: dbStatusMap[dbState] || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 for undefined routes
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
