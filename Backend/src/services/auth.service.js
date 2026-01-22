// src/services/auth.service.js
import prisma from "../db/prisma.js"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; 
import crypto from "node:crypto"; // Use this for tokens
export const registerUser = async (userData) => {
  try {
    const { password, ...rest } = userData;

    // 1. Password Hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 2. Database Entry using the shared 'prisma' instance
    const user = await prisma.user.create({
      data: {
        ...rest,
        password: hashedPassword,
      },
    });

    // 3. Security: Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;

  } catch (error) {
    if (error.code === 'P2002') {
      throw new Error("User with this email or username already exists");
    }
    throw error;
  }
};

export const loginUser = async (userName, password, email) => {
  // 1. Find user by username or email
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { userName },
        { email }
      ]
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  // 2. Compare password with hashed password using bcrypt
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // 3. Generate Tokens
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" }
  );

  // 4. Save refresh token to DB
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  const { password: _, refreshToken: __, ...userWithoutSecrets } = user;
  return { user: userWithoutSecrets, accessToken, refreshToken };
};

export const generateResetTokenAndSave = async (email) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error("No user found with this email address");
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    await prisma.user.update({
        where: { id: user.id },
        data: {
            forgotPasswordToken: hashedToken,
            forgotPasswordTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
        },
    });

    return resetToken; 
};


export const resetUserPassword = async (token, newPassword) => {
    // 1. Hash the incoming plain token to match what's in the DB
    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    // 2. Find user with this token and ensure it hasn't expired
    const user = await prisma.user.findFirst({
        where: {
            forgotPasswordToken: hashedToken,
            forgotPasswordTokenExpiry: {
                gt: new Date(), // "gt" means Greater Than (must be in the future)
            },
        },
    });

    if (!user) {
        throw new Error("Token is invalid or has expired");
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update password and CLEAR reset fields
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            forgotPasswordToken: null,
            forgotPasswordTokenExpiry: null,
        },
    });

    return true;
};


export const isPasswordCorrect = async (inputPassword, hashedPassword) => {
  return await bcrypt.compare(inputPassword, hashedPassword);
};