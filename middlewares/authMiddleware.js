const STATUS = require('../constants/statusCode');
const MESSAGES = require('../constants/messages');
const User = require('../model/userSchema');

const isAuthenticated = async (req, res, next) => {
  try {
    const wantJSON = req.headers.accept?.includes('application/json');

    if (!req.session.user) {
      if (wantJSON) {
        return res.status(STATUS.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.LOGIN_REQUIRED,
          redirect: '/login',
        });
      }
      return res.redirect('/login');
    }
    const user = await User.findById(req.session.user);
    if (!user || user.isBlocked) {
      return req.session.destroy(() => {
        if (wantJSON) {
          return res.status(STATUS.FORBIDDEN).json({
            success: false,
            message: MESSAGES.ADMIN_BLOCKED,
            redirect: '/login',
          });
        }
        return res.redirect('/login');
      });
    }
    return next();
  } catch (error) {
    return next(error)
  }
};
const isLogged = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
};
const isResetPassword = (req, res, next) => {
  if (!req.session.resetEmail) {
    return res.redirect('/forgot-password');
  }
  next();
};
const isVerified = (req, res, next) => {
  if (!req.session.otpPurpose) {
    return res.redirect('/signup');
  }
  next();
};
const adminAuth = (req, res, next) => {
  if (req.session.admin) {
    return next();
  }
  res.redirect('/admin/login');
};
const isAdminRestPass = (req, res, next) => {
  if (!req.session.adminRestEmail) {
    return res.redirect('/admin/forgot-password');
  }
  next();
};
const isAdminLogged = (req, res, next) => {
  if (req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  next();
};
module.exports = {
  isAuthenticated,
  isLogged,
  isVerified,
  adminAuth,
  isAdminLogged,
  isResetPassword,
  isAdminRestPass,
};
