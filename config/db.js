// backend/config/db.js
import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URL, {
        bufferCommands: false,
        // useNewUrlParser & useUnifiedTopology default in mongoose v6+
      })
      .then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  console.log(`MongoDB connected: ${cached.conn.connection.host}`);
  return cached.conn;
};

export default connectDB;
