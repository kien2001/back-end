const bcrypt = require("bcryptjs");
const crypto = require('crypto')
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const {
    validationResult
} = require('express-validator');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: "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"
    }
}))

exports.getLogin = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = [];
    }
    res.render("auth/login", {
        path: '/login',
        pageTitle: "Login",
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        }
    })
}
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array(),
            oldInput: {
                email,
                password
            }
        });
    }
    User.findOne({
            email: email
        })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: "invalid email or password",
                    oldInput: {
                        email,
                        password
                    }
                });
            }
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (!isMatch) {
                        return res.status(422).render('auth/login', {
                            path: '/login',
                            pageTitle: 'Login',
                            errorMessage: "invalid email or password",
                            oldInput: {
                                email,
                                password
                            }
                        });
                    }
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    return req.session.save((err) => {
                        console.log(err);
                        res.redirect('/');
                    })
                })
                .catch(err => {
                    console.log(err);
                    return res.redirect("/login")
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}
exports.postLogout = (req, res, next) => {
    req.session.destroy((error) => {
        console.log(error);
        res.redirect("/");
    })
}
exports.getSignUp = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = [];
    }
    res.render("auth/signup", {
        path: '/signup',
        pageTitle: "Sign Up",
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: ""
        }
    })
}
exports.postSignUp = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render("auth/signup", {
            path: '/signup',
            pageTitle: "Sign Up",
            errorMessage: errors.array(),
            oldInput: {
                email,
                password,
                confirmPassword
            }
        })
    }
    bcrypt.hash(password, 12)
        .then(hashPassword => {
            const newUser = new User({
                email: email,
                password: hashPassword,
                cart: {
                    items: []
                }
            })
            return newUser.save();
        })
        .then(result => {
            res.redirect("/login")
            return transporter.sendMail({
                to: email,
                from: "19020341@vnu.edu.vn",
                subject: "Hello word",
                html: "<h1>Hello world</h1>"
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

}
exports.getReset = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/reset", {
        path: '/reset',
        pageTitle: "Reset password",
        errorMessage: message
    })
}
exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buf) => {
        if (err) {
            console.log(err);
            res.redirect("/reset");
        }
        const token = buf.toString("hex");
        User.findOne({
                email: req.body.email
            })
            .then(user => {
                if (!user) {
                    req.flash("error", "No account with that email found.");
                    return res.redirect("/reset")
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                res.redirect("/login")
                transporter.sendMail({
                        to: req.body.email,
                        from: "19020341@vnu.edu.vn",
                        subject: "Reset password",
                        html: `
                        <p>You have requested a password reset.</p>
                        <p>Click <a href = "http://localhost:3000/reset/${token}">this link</a> to set a new password</p>
                    `
                    })
                    .catch(err => {
                        console.log(err);
                    })
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    })
}
exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        }).then(user => {
            let message = req.flash("error");
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render("auth/newPassword", {
                path: '/newPassword',
                pageTitle: "New password",
                errorMessage: message,
                userId: user._id.toString(),
                token: token
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}
exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const token = req.body.token;
    const newPassword = req.body.password;
    let newUser;
    User.findOne({
        resetToken: token,
        resetTokenExpiration: {
            $gt: Date.now()
        },
        _id: userId
    }).then(user => {
        newUser = user;
        return bcrypt.hash(newPassword, 12)
    }).then(hashPassword => {
        newUser.password = hashPassword;
        newUser.resetToken = undefined;
        newUser.resetTokenExpiration = undefined;
        return newUser.save();
    }).then(result => {
        res.redirect("/login");
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}