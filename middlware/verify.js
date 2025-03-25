import jwt from "jsonwebtoken";
import createError from "../utils/error.js";

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(createError(401, "Access Denied. No token provided."));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (!req.user.userId)
      return next(createError(403, "Invalid or Expired Token"));
    next();
  } catch (error) {
    return next(createError(403, "Invalid or Expired Token"));
  }
};
