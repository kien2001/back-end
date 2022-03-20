const {
    body, check
} = require('express-validator');
const User = require('../models/user')
exports.validateEditPro = [body("title", "Title field requires only letters").isString().isLength({
    min: 5
}).trim(), body("imageUrl", "Image URL requires exactly URL").isURL(), body("price", "Price field requires decimal number").isFloat(), body("description", "Description field requires at least 8 characters").isLength({
    min: 8
}).trim()];
exports.validateLogin = [
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.'),
    body('password', 'Password has to be valid.')
    .isLength({
        min: 5
    })
    .isAlphanumeric()
]
exports.validateSignUp = [check('email').isEmail().withMessage("Please enter a valid email").custom((value, {
        req
    }) => {
        return User.findOne({
                email: value
            })
            .then(userDoc => {
                if (userDoc) {
                    return Promise.reject("E-Mail exists already, please pick a different one.");
                }
            })
    }).normalizeEmail(), body('password', "Password requires at least 5 character, include alphabet or number").isLength({
        min: 5
    }).isAlphanumeric().trim(),
    body('confirmPassword').custom((value, {
        req
    }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords have to match.");
        }
        return true;
    }).trim()
]