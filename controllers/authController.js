import User from "../models/User.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import passport from "passport";

export const registerWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userExist = await User.findOne({ email });

    if (userExist) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed });

    const token = generateToken(user._id);
    user.token = token;
    user.isLoggedIn = true;
    await user.save();

    const resData = {
      email: user.email,
      role: user.role,
    };

    res.json({ token, resData });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userExist = await User.findOne({ email });

    if (!userExist) return res.status(400).json({ msg: "User does not exist" });

    const isMatch = await bcrypt.compare(password, userExist.password);

    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // generate token
    const token = generateToken(userExist._id);

    // save token in DB and set logged-in status
    userExist.token = token;
    userExist.isLoggedIn = true;
    await userExist.save();

    const resData = {
      email: userExist.email,
      role: userExist.role,
    };

    res.json({ token, resData });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await User.findOneAndUpdate(
      { email },
      {
        otp,
        otpExpiry: Date.now() + 5 * 60 * 1000,
      },
      { upsert: true, new: true }
    );

    await sendEmail(email, "Your OTP Code", `Your OTP is ${otp}`);
    res.json({ msg: "OTP sent" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, otp });

    if (!user) return res.status(400).json({ msg: "User does not exits" });

    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    const resData = {
      email: user.email,
      role: user.role,
    };
    res.json({ token: generateToken(user._id), resData });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const loginSuccess = (req, res) => {
  if (req.user) {
    res.status(200).json({
      error: false,
      message: "Successfully Logged In",
      user: req.user,
    });
  } else {
    res.status(403).json({ error: true, message: "Not Authorized" });
  }
};

export const loginFailed = (req, res) => {
  res.status(401).json({
    error: true,
    message: "Log in failure",
  });
};

export const googleAuth = passport.authenticate("google", ["profile", "email"]);

export const googleCallback = passport.authenticate("google", {
  successRedirect: process.env.CLIENT_URL,
  failureRedirect: "/login/failed",
});

export const logoutUser = async (req, res) => {
  try {
    const userId = req.userId;

    await User.findByIdAndUpdate(userId, {
      isLoggedIn: false,
      token: null, // clear token
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
