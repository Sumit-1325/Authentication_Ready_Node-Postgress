// src/routes/user.routes.js
import { Router } from "express";
import { handleRegister, handleLogin , handleLogout , handleForgotPassword , handleResetPassword, getUserProfile, updateUserDetail} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validatorMiddleware } from "../middlewares/validator.middleware.js";
import { userRegistrationValidators, userLoginValidators } from "../validators/index.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(userRegistrationValidators(), validatorMiddleware, handleRegister);
router.route("/login").post(userLoginValidators(), validatorMiddleware, handleLogin);
router.post("/logout", verifyJWT, handleLogout);
router.post("/forgot-password", handleForgotPassword);
router.post("/reset-password/:token", handleResetPassword);
router.get("/profile", verifyJWT, getUserProfile);
router.patch("/update", verifyJWT, upload.single("avatar"), updateUserDetail);
export default router;