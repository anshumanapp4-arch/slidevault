const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const passport = require('passport');
const {
  register,
  login,
  logout,
  getMe,
  registerValidation,
  loginValidation,
  oauthCallback,
} = require('../controllers/authController');

// POST /api/auth/register — Register a new user
router.post('/register', registerValidation, validate, register);

// POST /api/auth/login — Login user
router.post('/login', loginValidation, validate, login);

// POST /api/auth/logout — Logout user (clear cookie)
router.post('/logout', logout);

// GET /api/auth/me — Get current authenticated user
router.get('/me', protect, getMe);

// =======================
// Google OAuth Routes
// =======================
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  oauthCallback
);

// =======================
// GitHub OAuth Routes
// =======================
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  oauthCallback
);

module.exports = router;
