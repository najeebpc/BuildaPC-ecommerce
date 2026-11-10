const User = require('../../model/userSchema');
const mongoose = require('mongoose');
const Category = require('../../model/categorySchema.js');
const bcrypt = require('bcrypt');
const { generateOtp } = require('../../helpers/otpHelper');
const { sendVerificationEmail } = require('../../helpers/mailHelper');
const Otp = require('../../model/otpSchema');
const STATUS = require('../../constants/statusCode');
const MESSAGES = require('../../constants/messages');
const userServices = require('../../services/user/userServices');
const referralServices = require('../../services/user/referralServices');
const ReferralHistory = require('../../model/referralSchema');
const productServices = require('../../services/user/productServices');

const loadHomepage = async (req, res) => {
  try {
    let user = null;
    const categories = await Category.find({ isListed: true, isDeleted: false })
      .select('name')
      .limit(8);
    const featuredProducts = await productServices.featuredProduct();
    if (req.session.user) {
      user = await userServices.findUserById(req.session.user);
    }
    return res.render('user/home', { user, featuredProducts, categories });
  } catch (error) {
    res.status(STATUS.INTERNAL_SERVER_ERROR).send('Server error');
  }
};
const loadSignup = async (req, res) => {
  res.locals.formData = {
    name: '',
    email: '',
  };
  res.locals.message = '';
  if (req.session.signupError) {
    res.locals.formData = req.session.signupError.formData;
    res.locals.message = req.session.signupError.message;
    res.locals.field = req.session.signupError.field;
    req.session.signupError = null;
  }

  return res.render('user/signup', {
    referralCode: req.query.ref || '',
  });
};
const signup = async (req, res) => {
  try {
    const { name, email, password, cpassword, referralCode } = req.body;
    if (!userServices.isValidEmail(email)) {
      req.session.signupError = {
        message: MESSAGES.EMAIL_INVALID,
        field: 'email',
        formData: { name, email, referralCode },
      };
    }
    if (!userServices.isStrongPassword(password)) {
      req.session.signupError = {
        message: MESSAGES.PASSWORD_INVALID,
        field: 'password',
        formData: { name, email, referralCode },
      };
      return res.redirect('/signup');
    }
    if (password !== cpassword) {
      req.session.signupError = {
        message: MESSAGES.PASSWORD_MISMATCH,
        field: 'cpass',
        formData: { name, email, referralCode },
      };
      return res.redirect('/signup');
    }
    const existingName = await userServices.findUserByName(name);
    if (existingName) {
      req.session.signupError = {
        message: 'user name is already taken',
        field: 'name',
        formData: { name, email, referralCode },
      };
      return res.redirect('/signup');
    }
    const existingUser = await userServices.findUser(email);
    if (existingUser) {
      req.session.signupError = {
        message: MESSAGES.EMAIL_EXISTS,
        field: 'email',
        formData: { name, email, referralCode },
      };
      return res.redirect('/signup');
    }
    let validatedReferral = null;
    if (referralCode && referralCode.trim()) {
      validatedReferral = await referralServices.validateReferralCode(referralCode);
      if (!validatedReferral.valid) {
        req.session.signupError = {
          message: validatedReferral.message,
          field: 'referralCode',
          formData: { name, email, referralCode },
        };
        return res.redirect('/signup');
      }
    }
    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      req.session.signupError = {
        message: MESSAGES.EMAIL_SEND_FAILED,
        formData: { name, email },
      };
      return res.redirect('/signup');
    }
    await Otp.create({
      email: email,
      otp: otp,
      purpose: 'SIGNUP',
      expiresAt: new Date(Date.now() + 60 * 1000),
    });
    req.session.otpPurpose = 'SIGNUP';
    req.session.userData = {
      name,
      email,
      password,
      referralCode: validatedReferral ? validatedReferral.referralCode : null,
      referredId: validatedReferral ? validatedReferral.referrerId.toString() : null,
    };

    res.redirect('/verify-otp');
  } catch (error) {
    console.log('signup Error', error);
    res.redirect('/signup');
  }
};
const loadVerify = async (req, res) => {
  try {
    const email =
      req.session.otpPurpose === 'SIGNUP'
        ? req.session.userData?.email
        : req.session.otpPurpose === 'RESET-PASSWORD'
          ? req.session.resetEmail
          : req.session.otpPurpose === 'CHANGE-EMAIL'
            ? req.session.newEmail
            : undefined;

    const otpData = await Otp.findOne({
      email: email,
      purpose: req.session.otpPurpose,
    });
    if (!otpData) {
      return res.redirect('/login');
    }
    res.render('user/verify-otp', { expiresAt: otpData.expiresAt });
  } catch (error) {
    console.log(error);
    return res.redirect('/login');
  }
};
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.json({ success: false, message: MESSAGES.ENTER_OTP });
    }
    if (req.session.otpPurpose === 'SIGNUP') {
      const email = req.session.userData?.email;
      if (!email) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGE.SESSION_EXPIRED,
        });
      }
      const otpData = await Otp.findOne({ email: email, purpose: 'SIGNUP' });

      if (!otpData) {
        console.log('dont have otp');
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.OTP_INVALID,
        });
      }
      if (Date.now() > otpData.expiresAt.getTime()) {
        return res.status(400).json({
          success: false,
          message: MESSAGES.OTP_EXPIRED,
        });
      }

      if (otp != otpData.otp) {
        return res
          .status(STATUS.BAD_REQUEST)
          .json({ success: false, message: MESSAGES.OTP_INVALID });
      }
      const user = req.session.userData;
      const passwordHash = await userServices.securePassword(user.password);
      const dbSession = await mongoose.startSession();
      let savedUser;
      try {
        await dbSession.withTransaction(async () => {
          const saveUserData = new User({
            name: user.name,
            email: user.email,
            password: passwordHash,
            referredBy: user.referredId || null,
          });
          await saveUserData.save({ session: dbSession });
          if (user.referredId) {
            await ReferralHistory.create(
              [
                {
                  referrerId: user.referredId,
                  referredUserId: saveUserData._id,
                  status: 'pending',
                  referredUserRewarded: false,
                },
              ],
              { session: dbSession },
            );
          }
          savedUser = saveUserData;
        });
      } finally {
        await dbSession.endSession();
      }
      await Otp.deleteOne({ _id: otpData._id });
      req.session.user = savedUser;
      return res.json({ success: true, redirectUrl: '/' });
    }

    if (req.session.otpPurpose === 'RESET-PASSWORD') {
      const email = req.session.resetEmail;
      const otpData = await Otp.findOne({
        email: email,
        purpose: 'RESET-PASSWORD',
      });
      if (!otpData) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.OTP_INVALID,
        });
      }
      if (Date.now() > otpData.expiresAt.getTime()) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.OTP_EXPIRED,
        });
      }

      if (otp != otpData.otp) {
        return res
          .status(STATUS.BAD_REQUEST)
          .json({ success: false, message: MESSAGES.OTP_INVALID });
      }
      await Otp.deleteOne({
        _id: otpData._id,
      });
      return res.json({ success: true, redirectUrl: '/change-password' });
    }
    if (req.session.otpPurpose === 'CHANGE-EMAIL') {
      const email = req.session.newEmail;
      if (!email) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.SESSION_EXPIRED,
        });
      }
      const otpData = await Otp.findOne({ email: email, purpose: 'CHANGE-EMAIL' });
      if (!otpData) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.OTP_INVALID,
        });
      }
      if (Date.now() > otpData.expiresAt.getTime()) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.OTP_EXPIRED,
        });
      }
      if (otp != otpData.otp) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.OTP_INVALID,
        });
      }

      await User.findByIdAndUpdate(req.session.user, {
        email: req.session.newEmail,
      });
      await Otp.deleteOne({
        _id: otpData._id,
      });

      req.session.newEmail = null;

      req.session.profileSuccess = MESSAGES.EMAIL_UPDATED_SUCCESS;

      return res.json({
        success: true,
        redirectUrl: '/account',
      });
    }
  } catch (error) {
    console.error(error.stack);
    return res
      .status(STATUS.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};
const resendOtp = async (req, res) => {
  try {
    if (req.session.otpPurpose === 'SIGNUP') {
      if (!req.session.userData) {
        return res.json({ success: false, message: MESSAGES.SESSION_EXPIRED });
      }
      const { email } = req.session.userData;
      const newOtp = generateOtp();
      const emailSend = await sendVerificationEmail(email, newOtp);

      if (!emailSend) {
        res.json({ success: false, message: MESSAGES.SOMETHING_WENT_WRONG });
      }
      await Otp.deleteMany({
        email: email,
        purpose: 'SIGNUP',
      });
      const newOtpData = await Otp.create({
        email: email,
        otp: newOtp,
        purpose: 'SIGNUP',
        expiresAt: new Date(Date.now() + 60 * 1000),
      });
      return res.json({
        success: true,
        message: MESSAGES.OTP_SENT,
        expiresAt: newOtpData.expiresAt,
      });
    }
    if (req.session.otpPurpose === 'RESET-PASSWORD') {
      const resetEmail = req.session.resetEmail;
      if (!resetEmail) {
        return res.json({ success: false, message: MESSAGES.SESSION_EXPIRED });
      }
      const newOtp = generateOtp();
      const emailSend = await sendVerificationEmail(resetEmail, newOtp);

      if (!emailSend) {
        return res.json({ success: false, message: MESSAGES.SOMETHING_WENT_WRONG });
      }
      await Otp.deleteMany({
        email: resetEmail,
        purpose: 'RESET-PASSWORD',
      });
      const newOtpData = await Otp.create({
        email: resetEmail,
        otp: newOtp,
        purpose: 'RESET-PASSWORD',
        expiresAt: new Date(Date.now() + 60 * 1000),
      });
      return res.json({
        success: true,
        message: MESSAGES.OTP_SENT,
        expiresAt: newOtpData.expiresAt,
      });
    }
    if (req.session.otpPurpose === 'CHANGE-EMAIL') {
      const newEmail = req.session.newEmail;

      if (!newEmail) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.SESSION_EXPIRED,
        });
      }
      const newOtp = generateOtp();
      const emailSend = sendVerificationEmail(newEmail, newOtp);
      if (!emailSend) {
        return res.json({ success: false, message: MESSAGES.SOMETHING_WENT_WRONG });
      }
      await Otp.deleteMany({
        email: newEmail,
        purpose: 'CHANGE-EMAIL',
      });
      const newOtpData = await Otp.create({
        email: newEmail,
        otp: newOtp,
        purpose: 'CHANGE-EMAIL',
        expiresAt: new Date(Date.now() + 60 * 1000),
      });
      return res.json({
        success: true,
        message: MESSAGES.OTP_SENT,
        expiresAt: newOtpData.expiresAt,
      });
    }
  } catch (error) {
    console.log(error.stack);
    res.json({ success: false, message: MESSAGES.SOMETHING_WENT_WRONG });
  }
};
const loadLogin = async (req, res) => {
  if (req.session.loginError) {
    res.locals.formData = req.session.loginError.formData;
    res.locals.message = req.session.loginError.message;
    res.locals.field = req.session.loginError.field;

    req.session.loginError = null;
  }
  if (req.session.authSuccess) {
    res.locals.message = req.session.authSuccess.message;
    res.locals.field = req.session.authSuccess.field;
    req.session.authSuccess = null;
  }
  return res.render('user/login');
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailTrim = email.trim().toLowerCase();
    const user = await userServices.findUser(emailTrim);
    if (!user) {
      req.session.loginError = {
        message: MESSAGES.USER_NOT_FOUND,
        field: 'email',
        formData: { email },
      };
      return res.redirect('/login');
    }
    if (user.isBlocked) {
      req.session.authSuccess = {
        message: MESSAGES.ADMIN_BLOCKED,
        field: 'isBlocked',
      };
      return res.redirect('/login');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.session.loginError = {
        message: MESSAGES.PASSWORD_MISMATCH,
        field: 'password',
        formData: { email },
      };
      return res.redirect('/login');
    }
    req.session.user = user;
    res.redirect('/');
  } catch (error) {
    req.session.loginError = {
      message: MESSAGES.SOMETHING_WENT_WRONG,
    };
    res.redirect('/login');
  }
};
const loadForgotPassword = (req, res) => {
  if (req.session.forgotError) {
    res.locals.message = req.session.forgotError.message;
    res.locals.formData = req.session.forgotError.formData;
    req.session.forgotError = null;
  }
  res.render('user/forgot-password');
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      req.session.forgotError = {
        message: MESSAGES.EMAIL_INVALID,
        formData: { email },
      };
      return res.redirect('/forgot-password');
    }
    const user = await userServices.findUser(email);
    if (!user) {
      return res.redirect('/forgot-password');
    }
    const otp = generateOtp();
    const emailSend = await sendVerificationEmail(email, otp);
    if (!emailSend) {
      req.session.forgotError = {
        message: MESSAGES.EMAIL_SEND_FAILED,
        formData: { email },
      };
      return res.redirect('/forgot-password');
    }
    await Otp.deleteMany({
      email: email,
      purpose: 'RESET-PASSWORD',
    });
    await Otp.create({
      email: email,
      otp: otp,
      purpose: 'RESET-PASSWORD',
      expiresAt: new Date(Date.now() + 60 * 1000),
    });
    req.session.resetEmail = email;
    req.session.otpPurpose = 'RESET-PASSWORD';
    res.redirect('/verify-otp');
  } catch (error) {
    res.redirect('/forgot-password');
  }
};
const loadChangePassword = (req, res) => {
  if (req.session.resetError) {
    res.locals.message = req.session.resetError.message;
    res.locals.field = req.session.resetError.field;
    req.session.resetError = null;
  }
  return res.render('user/change-password');
};
const changePassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    if (!userServices.isStrongPassword(password)) {
      req.session.resetError = {
        message: MESSAGES.PASSWORD_INVALID,
        feild: 'password',
      };
      return res.redirect('/change-password');
    }
    if (password !== confirmPassword) {
      req.session.resetError = {
        message: MESSAGES.PASSWORD_MISMATCH,
        field: 'password',
      };
      return res.redirect('/change-password');
    }
    const passwordHash = await userServices.securePassword(password);
    await User.updateOne({ email: req.session.resetEmail }, { $set: { password: passwordHash } });
    req.session.resetEmail = null;
    req.session.resetOtp = null;
    req.session.otpPurpose = null;

    ((req.session.authSuccess = {
      message: MESSAGES.PASSWORD_CHANGED,
      field: 'passChange',
    }),
      res.redirect('/login'));
  } catch (error) {
    res.redirect('/change-password');
  }
};
const googleCallback = async (req, res) => {
  try {
    if (req.user.isBlocked) {
      req.session.authSuccess = {
        message: MESSAGES.ADMIN_BLOCKED,
        field: 'isBlocked',
      };
      return res.redirect('/login');
    }
    req.session.user = req.user;
    return res.redirect('/');
  } catch (error) {
    console.error('Google login error', error);
    return res.redirect('/login');
  }
};
const logout = (req, res) => {
  req.session.user = null;
  res.redirect('login');
};
module.exports = {
  loadHomepage,
  loadSignup,
  signup,
  loadVerify,
  verifyOtp,
  resendOtp,
  loadLogin,
  login,
  loadForgotPassword,
  forgotPassword,
  loadChangePassword,
  changePassword,
  googleCallback,
  logout,
};
