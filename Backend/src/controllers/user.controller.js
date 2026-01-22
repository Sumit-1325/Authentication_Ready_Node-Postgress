// src/controllers/user.controller.js
import { registerUser, loginUser } from "../services/auth.service.js";
import prisma from "../db/prisma.js"; 
import { generateResetTokenAndSave } from "../services/auth.service.js";
import { sendEmail } from "../utils/mail.util.js";
import { resetUserPassword } from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/api-error.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";


export const handleRegister = asyncHandler(async (req, res) => {
  const { userName, email, password, fullName } = req.body;

  if (!userName || !email || !password) {
    throw new apiError("Username, email, and password are required", 400);
  }

  const newUser = await registerUser({
    userName,
    email,
    password,
    fullName
  });

  if (!newUser) {
    throw new apiError("User registration failed", 500);
  }

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: newUser
  });
});

export const handleLogin = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;
  
  if (!password) {
    throw new apiError("Password is required", 400);
  }
  
  if (!email && !userName) {
    throw new apiError("Email or Username is required", 400);
  }

  const { user, accessToken, refreshToken } = await loginUser(userName, password, email);

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "None"
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      success: true,
      message: "Login successful",
      user,
      accessToken
    });
});

export const handleLogout = asyncHandler(async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null }
  });

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
});

export const handleForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const resetToken = await generateResetTokenAndSave(email);
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const htmlContent = `
    <h1>Password Reset</h1>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none;">Reset Password</a>
    <p>This link expires in 15 minutes.</p>
  `;

  await sendEmail({
    to: email,
    subject: "Password Reset Request",
    html: htmlContent
  });

  return res.status(200).json({ message: "Password reset link sent to your email" });
});


export const handleResetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new apiError("New password is required", 400);
  }

  await resetUserPassword(token, password);

  return res.status(200).json({ 
    success: true,
    message: "Password reset successful. You can now login with your new password." 
  });
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      userName: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new apiError("User not found", 404);
  }

  return res.status(200).json({
    success: true,
    message: "User profile retrieved successfully",
    data: user
  });
});

export const updateUserDetail = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { fullName } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new apiError("User not found", 404);
  }

  let avatarUrl = user.avatar;

  if (req.file) {
    try {
      avatarUrl = await uploadToCloudinary(req.file.path);

      if (user.avatar) {
        try {
          await deleteFromCloudinary(user.avatar);
        } catch (deleteError) {
          console.error("Error deleting old avatar:", deleteError);
        }
      }
    } catch (uploadError) {
      throw new apiError(`Avatar upload failed: ${uploadError.message}`, 500);
    }
  }

  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (avatarUrl) updateData.avatar = avatarUrl;

  if (Object.keys(updateData).length === 0) {
    throw new apiError("No fields to update", 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      userName: true,
      email: true,
      fullName: true,
      avatar: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return res.status(200).json({
    success: true,
    message: "User details updated successfully",
    data: updatedUser
  });
});