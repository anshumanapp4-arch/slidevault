const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_GOOGLE_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER_GOOGLE_SECRET',
      callbackURL: (process.env.BACKEND_URL || '') + '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }

        // Check if user exists with the same email
        const email = profile.emails[0].value;
        user = await User.findOne({ email });
        if (user) {
          // Link google account to existing user
          user.googleId = profile.id;
          if (!user.avatar) user.avatar = profile.photos[0].value;
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName || 'Google User',
          email: email,
          avatar: profile.photos[0] ? profile.photos[0].value : '',
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || 'PLACEHOLDER_GITHUB_ID',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'PLACEHOLDER_GITHUB_SECRET',
      callbackURL: (process.env.BACKEND_URL || '') + '/api/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });
        if (user) {
          return done(null, user);
        }

        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `${profile.username}@github.com`;
        
        user = await User.findOne({ email });
        if (user) {
          user.githubId = profile.id;
          if (!user.avatar) user.avatar = profile.photos[0].value;
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          githubId: profile.id,
          name: profile.displayName || profile.username,
          email: email,
          avatar: profile.photos[0] ? profile.photos[0].value : '',
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);
