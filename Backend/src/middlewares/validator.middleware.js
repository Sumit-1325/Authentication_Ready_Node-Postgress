// src/middlewares/validator.middleware.js
import { validationResult } from "express-validator";
import { apiError } from "../utils/api-error.js";

const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));
  throw new apiError("Received data is not valid.", 400, extractedErrors);
};

export { validatorMiddleware };
