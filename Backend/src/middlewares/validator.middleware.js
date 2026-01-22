// src/middlewares/validator.middleware.js
import { validationResult } from "express-validator";
import { apiError } from "../utils/api-error.js";

const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().forEach((err) => {
    extractedErrors.push({ 
      field: err.path, 
      message: err.msg,
      value: err.value 
    });
  });
  throw new apiError("Validation failed. Please check the errors below.", 400, extractedErrors);
};

export { validatorMiddleware };
