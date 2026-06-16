const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

const connectDB = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');
const errorHandler = require('./middleware/errorHandler');
const session = require('express-session');
const passport = require('passport');

// Load passport configuration
require('./config/passport');

// Import routes
const authRoutes = require('./routes/auth');
const slideRoutes = require('./routes/slides');

const app = express();

// ---------------------
// Global Middleware
// ---------------------

// Security headers
app.use(helmet());

// CORS — allow frontend origin with credentials (cookies)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Express session (Required for Passport OAuth state)
app.use(
  session({
    secret: process.env.JWT_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ---------------------
// Routes
// ---------------------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/slides', slideRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

// ---------------------
// Start Server
// ---------------------

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Configure Cloudinary
  configureCloudinary();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

startServer();

module.exports = app;
