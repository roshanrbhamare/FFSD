import express from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";// Import SQLite connection

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.redirect("/api/v1/user/login");
    }

    // Verify JWT token (replace 'your_secret_key' with your actual secret)
    const decoded = jwt.verify(token, "JWT_SECRET");
    if (!decoded) {
      return res.redirect("/api/v1/user/login");
    }

    // Fetch user from SQLite database
    db.get("SELECT id, role FROM users WHERE id = ?", [decoded.userId], (err, user) => {
      if (err || !user) {
        console.error("User not found:", err);
        return res.redirect("/api/v1/user/login");
      }

      console.log("User Role:", user.role);
      req.role = user.role || "admin";
      req.userId = user.id;
      console.log("Visisted")
      next();
    });
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.redirect("/api/v1/user/login");
  }
};

export default isAuthenticated;
