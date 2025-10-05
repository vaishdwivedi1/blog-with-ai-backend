import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization; // Bearer <token>
  if (!authHeader) return res.status(401).json({ msg: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "yourjwtsecret"); // must match what you used in sign
    req.userId = decoded.id; // attach userId for next middleware/controllers
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};
