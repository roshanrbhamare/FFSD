import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import products from '../data/products.js';
import { error } from 'console';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const router = express.Router();
router.get("/login", (req, res) => {
  res.render('user/login.ejs', { title: 'login', error: "" })
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userCheck = await User.findOne({ email });
    if (!userCheck) {
      return res.status(404).json({
        message: "User Don't exists",
        success: false
      })
    }

    const token = jwt.sign({ userId: userCheck._id }, "JWT_SECRET");
    res.cookie.token = token;
    res.status(200).json({
      message: "Logged in successfully",
      success: true,
      user: userCheck,
      token
    })


  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: "Error logging in",
      success: false
    })
  }
})



router.get("/signup", (req, res) => {
  res.render('user/signup.ejs', { title: 'signup' })
})

router.post("/signup", async (req, res) => {
  try {
    const { firstname, lastname, password, email, role } = req.body;
    const userCheck = await User.findOne({ email });
    if (userCheck) {
      return res.status(404).json({
        message: "User already exists",
        success: false
      })
    }

    const hashPassword = await bcrypt.hash(password, 10);
    console.log(hashPassword);
    const user = User.create({
      firstname, lastname, password: hashPassword, email, role: role.toLowerCase()
    });
    (await user).save()

    return res.status(200).json({
      message: "Account created successfully  ",
      success: true,
      user
    })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error creating account",
      success: false
    })
  }
})


router.get("/cart/add/:id", (req, res) => {
  try {

  } catch (error) {

  }
})

router.get("/cart/remove/:id", (req, res) => {
  try {

  } catch (error) {

  }
})

router.delete("/cart/remove/:id", (req, res) => {
  try {

  } catch (error) {

  }
})

export default router;