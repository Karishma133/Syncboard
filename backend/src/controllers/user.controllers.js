import User from "../models/User.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

// FIX: frontend (vercel.app) and backend (onrender.com) are different
// domains, so this is a cross-site setup. A cookie without
// `SameSite=None; Secure` is silently dropped by the browser on
// cross-site requests — login was returning 200 but the browser never
// actually kept the cookie, so the very next request looked logged-out.
// In local dev (http://localhost) `secure: true` would block the cookie
// entirely, so this only turns on in production.
const isProd = process.env.NODE_ENV === "production";
const authCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
};

const userRegister = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "user already exist"
      })
    }
    const user = await User.create({
      name,
      email,
      password
    })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not register"
      })
    }
    const token = crypto.randomBytes(32).toString("hex");
    user.verificationToken = token;
    await user.save();
    //sending email to verify the token
    const transport = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD
      }
    });
    const mailOption = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: user.email,
      subject: "VERIFY YOUR EMAIL",
      text: `click on the below link for verification ${process.env.BASE_URL}/api/v1/user/verify/${token}`
    }
    await transport.sendMail(mailOption);
    res.status(201).json({
      message: "User register succesfully",
      success: true
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "User not register ",
      error: error.message
    })
  }
};

const userVerify = async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Invalid token"
    })
  }
  const user = await User.findOne({ verificationToken: token })
  if (!user) {
    return res.status(400).json({
      success: false,
      message: "invalid token"
    })
  }
  user.isVerfied = true;
  user.verificationToken = undefined;
  await user.save();
  res.status(201).json({
    message: "User verify succesfully",
    success: true
  })
}

const userLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "all field required"
    })
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "invalid email,password"
      })
    }
    const isMatched = await bcrypt.compare(password, user.password)
    if (!isMatched) {
      return res.status(400).json({
        success: false,
        message: "invalid email,password"
      })
    }
    if (!user.isVerfied) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email first"
      })
    }
    const token = jwt.sign({ id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    )
    const cookieOption = {
      ...authCookieOptions,
      maxAge: 24 * 60 * 60 * 1000
    };
    res.cookie("token", token, cookieOption);
    res.status(200).json({
      success: true,
      message: "User login succesfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    })
  }
}

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) {
      return res.status(400).json({
        message: "user not found",
        success: false
      })
    }
    res.status(200).json({
      success: true,
      user
    })
  } catch (error) {
    return res.status(500).json({
      message: "user not found",
      success: false
    })
  }
}

const logout = async (req, res) => {
  try {
    res.clearCookie("token", authCookieOptions)
    return res.status(200).json({
      message: "Logout successful",
      success: true
    });
  } catch (error) {
    return res.status(500).json({
      message: "logout failed",
      success: false
    })
  }
}

const forgetPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      status: false,
      message: "all fields are required"
    })
  }
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({
        message: "User not found"
      })
    }
    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = token;
    user.passwordResetExpire = Date.now() + 10 * 60 * 1000;
    await user.save();
    const transport = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD
      }
    });
    const mailOption = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: user.email,
      subject: "RESET YOUR PASSWORD",
      text: `click on the below link for reset password ${process.env.BASE_URL}/api/v1/user/resetpassword/${token}`
    }
    await transport.sendMail(mailOption);
    res.status(201).json({
      success: true
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Something went wrong. Please try again later."
    })
  }
}

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      res.status(400).json({
        status: false,
        message: "All fields are required"
      })
    }
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpire: { $gt: Date.now() }
    })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      })
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();
    res.status(201).json({
      success: true,
      message: "password reset successfully"
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "password reset failed"
    })
  }
}

export { userRegister, userVerify, userLogin, logout, forgetPassword, resetPassword, getMe }
