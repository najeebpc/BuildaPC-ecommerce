const express = require('express');
const app = express();
require('dotenv').config();
const path = require('path');
const session = require('express-session');
const {MongoStore} = require('connect-mongo');
const passport = require('passport');
require('./config/passport');
const cartCount = require('./middlewares/cartCount');
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
const connectDB = require('./config/db');

const port = process.env.PORT||3000;

app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views'), path.join(__dirname, 'views/admin')]);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name:'buildapc.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store:MongoStore.create({
      mongoUrl:process.env.MONGODB_URI,
      collectionName:'sessions',
      ttl:14*24*60*60,
    }),
    cookie:{
      httpOnly:true,
      secure:process.env.NODE_ENV==='production',
      sameSite:'lax',
      maxAge:14*24*60*60*1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());
app.use(cartCount);
app.use((req, res, next) => {
  res.locals.formData = req.session.formData || {};
  res.locals.message = req.session.message || null;
  res.locals.field = req.session.field || null;
  res.locals.profileError = null;
  res.locals.profileSuccess = null;

  delete req.session.message;
  delete req.session.field;
  next();
});

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.use('/', userRouter);
app.use('/admin', adminRouter);

app.use((req, res) => {
  res.status(404).render('user/page-404');
});
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).render('user/server-error');
});
const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};
startServer();
