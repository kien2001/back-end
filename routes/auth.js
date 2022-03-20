const express = require('express');

const authController = require('../controllers/auth');
const validate = require('../middleware/validation');

const router = express.Router();

router.get("/login", authController.getLogin)

router.post( '/login',validate.validateLogin,authController.postLogin);

router.post("/logout", authController.postLogout)

router.get("/signup", authController.getSignUp)

router.post("/signup", validate.validateSignUp, authController.postSignUp)

router.get("/reset", authController.getReset)

router.post("/reset", authController.postReset)

router.get("/reset/:token", authController.getNewPassword)

router.post("/newPassword", authController.postNewPassword)


module.exports = router;