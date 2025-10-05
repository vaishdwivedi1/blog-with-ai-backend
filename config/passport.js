import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID:
        "410177333637-4sld924rro28alqld7659b9p0quoiodg.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // If user exists but no googleId yet, link it
          if (!user.googleId) {
            user.googleId = profile.id;
          }
          user.isLoggedIn = true;
          await user.save();
        } else {
          // No user with that email → create new one
          user = await User.create({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            isLoggedIn: true,
            isVerified: true,
          });
        }

        return cb(null, user);
      } catch (error) {
        return cb(error, null);
      }
    }
  )
);
