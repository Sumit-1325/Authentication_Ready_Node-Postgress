// src/controllers/user.controller.js
import { registerUser, loginUser } from "../services/auth.service.js";
import prisma from "../db/prisma.js"; 
import { generateResetTokenAndSave } from "../services/auth.service.js";
import { sendEmail } from "../utils/mail.util.js";
import { resetUserPassword } from "../services/auth.service.js";


export const handleRegister = async (req, res) => {
  try {
    const { userName, email, password, fullName } = req.body;

    
    const newUser = await registerUser({
      userName,
      email,
      password,
      fullName
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: newUser
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const { user, accessToken, refreshToken } = await loginUser(email, password);

    const cookieOptions = {
      httpOnly: true, // Security: frontend JS cannot touch these
      secure: true,
      sameSite: "None"
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        message: "Login successful",
        user,
        accessToken // Return this so frontend can use it in headers
      });

  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

export const handleLogout = async (req, res) => {
    try {
        // 1. Clear Refresh Token in Database
        await prisma.user.update({
            where: { id: req.user.id },
            data: { refreshToken: null }
        });

        // 2. Clear Cookies
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json({ message: "User logged out successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const handleForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Generate and save token
        const resetToken = await generateResetTokenAndSave(email);

        // 2. Create Reset URL (Frontend URL)
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // 3. Email Template
        const htmlContent = `
            <h1>Password Reset</h1>
            <p>You requested a password reset. Click the link below to set a new password:</p>
            <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none;">Reset Password</a>
            <p>This link expires in 15 minutes.</p>
        `;

        // 4. Send the Email
        await sendEmail({
            to: email,
            subject: "Password Reset Request",
            html: htmlContent
        });

        return res.status(200).json({ message: "Password reset link sent to your email" });

    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};


export const handleResetPassword = async (req, res) => {
    try {
        const { token } = req.params; // Getting token from URL
        const { password } = req.body; // Getting new password from body

        if (!password) {
            return res.status(400).json({ message: "New password is required" });
        }

        await resetUserPassword(token, password);

        return res.status(200).json({ 
            message: "Password reset successful. You can now login with your new password." 
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};