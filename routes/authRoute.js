import express from "express";
import {
  registerWithPassword,
  loginWithPassword,
  verifyOTP,
  sendOTP,
  logoutUser,
} from "../controllers/authController.js";
import passport from "passport";
import jwt from "jsonwebtoken";
const router = express.Router();

router.post("/registerWithPassword", registerWithPassword);
router.post("/loginWithPassword", loginWithPassword);
router.post("/sendOTP", sendOTP);
router.post("/verifyOTP", verifyOTP);
router.post("/logoutUser", logoutUser);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// router.get(
//   "/google/callback",
//   passport.authenticate("google", { session: false }),
//   (req, res) => {
//     try {
//       const token = jwt.sign(
//         { id: req.user._id, email: req.user.email },
//         "yourjwtsecret",
//         { expiresIn: "1d" }
//       );
//       res.redirect(`http://localhost:5173/auth-success?token=${token}`);
//     } catch (error) {
//       console.error("Google login error:", error);
//       res.redirect(`http://localhost:5173/login?error=google_failed`);
//     }
//   }
// );

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        "yourjwtsecret",
        { expiresIn: "1d" }
      );

      // save token in DB
      req.user.token = token;
      req.user.isLoggedIn = true;
      await req.user.save();

      res.redirect(`http://localhost:5173/auth-success?token=${token}`);
    } catch (error) {
      console.error("Google login error:", error);
      res.redirect(`http://localhost:5173/login?error=google_failed`);
    }
  }
);

router.get("/me", (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
