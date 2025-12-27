// src/routes/user.routes.js
import { Router } from "express";
import { handleRegister, handleLogin , handleLogout , handleForgotPassword , handleResetPassword} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.post("/logout",verifyJWT, handleLogout);
router.post("/forgot-password", handleForgotPassword);
router.post("/reset-password/:token", handleResetPassword);
export default router;