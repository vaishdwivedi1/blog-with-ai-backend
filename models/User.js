import mongoose, { Schema, Types } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String },
    email: { type: String },
    password: { type: String },
    googleId: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    isLoggedIn: { type: Boolean, default: false },
    customFeed: [{ type: String }],
    token: { type: String }, // store JWT token here
    blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
    likedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
    bookmarkedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
    series: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserSeries" }],
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
