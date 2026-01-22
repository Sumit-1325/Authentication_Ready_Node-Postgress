// src/validators/user.validators.js
import { body } from "express-validator";

const userRegistrationValidators = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email field cannot be empty.")
      .isEmail()
      .withMessage("Please provide a valid email address."),

    body("userName")
      .trim()
      .notEmpty()
      .withMessage("Username field cannot be empty.")
      .isLowercase()
      .withMessage("Username must be in lowercase.")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters long."),

    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password field cannot be empty.")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long.")
  ];
};

const userLoginValidators = () => {
  return [
    body("userName")
      .trim()
      .notEmpty()
      .withMessage("Username field cannot be empty."),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password field cannot be empty.")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long.")
  ];
};

const forgotPasswordValidators = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email field cannot be empty.")
      .isEmail()
      .withMessage("Please provide a valid email address.")
  ];
};

const resetPasswordValidators = () => {
  return [
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password field cannot be empty.")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long.")
  ];
};

export { userRegistrationValidators, userLoginValidators, forgotPasswordValidators, resetPasswordValidators };
