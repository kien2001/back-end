  const path = require('path');
  const express = require('express');
  const bodyParser = require('body-parser');
  const mongoose = require('mongoose');
  const session = require('express-session');
  const MongoDbStore = require('connect-mongodb-session')(session);
  const csrf = require('csurf');
  const flash = require('connect-flash');
  const MONGODB_URL = 'mongodb+srv://kien:01693204793@shop-udemy.59p3l.mongodb.net/shop';
  const errorController = require('./controllers/error');
  const User = require('./models/user');

  const app = express();
  const store = new MongoDbStore({
    uri: MONGODB_URL,
    collection: "sessions"
  })
  const csrfProtection = csrf();
  app.set('view engine', 'ejs');
  app.set('views', 'views');

  const adminRoutes = require('./routes/admin');
  const shopRoutes = require('./routes/shop');
  const authRoutes = require('./routes/auth');

  app.use(bodyParser.urlencoded({
    extended: false
  }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: "my secret",
    store: store
  }))
  app.use(csrfProtection)
  app.use(flash());
  app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
  })
  app.use((req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    User.findById(req.session.user._id)
      .then(user => {
        if (!user) {
          return next();
        }
        req.user = user;
        next();
      })
      .catch(err => {
        next(new Error(err))
      });
  });
  app.use('/admin', adminRoutes);
  app.use(shopRoutes);
  app.use(authRoutes);
  app.use('/500', errorController.get500);
  app.use(errorController.get404);
  app.use((error, req, res, next) => {
    res.status(500).render('500', {
      pageTitle: 'Something went wrong',
      path: '/500',
      isAuthenticated: req.session.isLoggedIn
    });
  })

  mongoose
    .connect(
      MONGODB_URL
    )
    .then(result => {
      app.listen(3000);
    })
    .catch(err => {
      console.log(err);
    });