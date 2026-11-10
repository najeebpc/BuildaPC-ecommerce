const User = require('../../model/userSchema');
const STATUS = require('../../constants/statusCode');
const MESSAGES = require('../../constants/messages');
const bcrypt = require('bcrypt');
const Otp = require('../../model/otpSchema');
const { generateOtp } = require('../../helpers/otpHelper');
const { sendVerificationEmail } = require('../../helpers/mailHelper');
const userServices = require('../../services/user/userServices');
const fs = require('fs');
const path = require('path');

const loadAccount = async (req, res) => {
  try {
    const user = await userServices.findUserById(req.session.user);
    if (req.session.profileError) {
      res.locals.profileError = req.session.profileError;
      req.session.profileError = null;
    }

    if (req.session.profileSuccess) {
      res.locals.profileSuccess = req.session.profileSuccess;
      req.session.profileSuccess = null;
    }

    res.render('user/myaccount', {
      user,
      active: 'account',
    });
  } catch (error) {
    res.redirect('/');
  }
};
const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    const { username, fullName, phone } = req.body;

    if (!username || !/^[A-Za-z]{3,}$/.test(username.trim())) {
      req.session.profileError = MESSAGES.PROFILE_USER_ERROR;
      return res.redirect('/account');
    }

    if (fullName && fullName.trim().length < 3) {
      req.session.profileError = MESSAGES.PROFILE_FULLNAME_ERROR;
      return res.redirect('/account');
    }
    if (!phone || !/^[6-9]\d{9}$/.test(phone.trim())) {
      req.session.profileError = MESSAGES.PHONE_WALID;
      return res.redirect('/account');
    }

    await userServices.updateProfile(userId, {
      name: username.trim(),
      fullName: fullName?.trim() || '',
      phone: phone.trim(),
    });
    req.session.profileSuccess = MESSAGES.PROFILE_UPDATED;
    return res.redirect('/account');
  } catch (error) {
    res.redirect('/account');
  }
};
const uploadProfileImage = async (req, res) => {
  try {
    const userId = req.session.user;
    if (!req.file) {
      req.session.message = MESSAGES.SELECT_IMG;
      req.session.field = 'image';
      return res.redirect('/account');
    }
    const user = await userServices.findUserById(userId);
    console.log('found user', user);
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '../../public/uploads/profile', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    await userServices.updateProfileImage(userId, req.file.filename);
    req.session.profileSuccess = MESSAGES.IMG_ADDED;
    return res.redirect('/account');
  } catch (error) {
    req.session.message = MESSAGES.IMG_ERROR;
    req.session.field = 'image';
    return res.redirect('/account');
  }
};
const removeProfileImage = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await userServices.findUserById(userId);
    if (user.profileImage) {
      const imagePath = path.join(__dirname, '../../public/uploads/profile', user.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      await userServices.removeProfileImage(userId);
    }
    return res.redirect('/account');
  } catch (error) {
    console.log(error);
    return res.redirect('/account');
  }
};
const loadChangeEmail = (req, res) => {
  if (req.session.emailError) {
    res.locals.message = req.session.emailError.message;
    res.locals.formData = req.session.emailError.formData;
    req.session.emailError = null;
  }
  res.render('user/change-email');
};
const changeEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const userExist = await userServices.findUser(email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      req.session.emailError = {
        message: MESSAGES.EMAIL_EXISTS,
        formData: { email },
      };
      return res.redirect('/account/change-email');
    }
    if (userExist) {
      req.session.emailError = {
        message: MESSAGES.EMAIL_EXISTS,
        formData: { email },
      };
      return res.redirect('/account/change-email');
    }
    const otp = generateOtp();
    const emailSend = await sendVerificationEmail(email, otp);
    if (!emailSend) {
      req.session.emailError = {
        message: MESSAGES.EMAIL_SEND_FAILED,
      };
      return res.redirect('/account/change-email');
    }
    await Otp.create({
      email: email,
      otp: otp,
      purpose: 'CHANGE-EMAIL',
      expiresAt: new Date(Date.now() + 60 * 1000),
    });
    req.session.newEmail = email;
    req.session.otpPurpose = 'CHANGE-EMAIL';
    return res.redirect('/verify-otp');
  } catch (error) {
    console.log(error);
    req.session.emailError = MESSAGES.SOMETHING_WENT_WRONG;
    return res.redirect('/account/change-email');
  }
};
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.session.message = MESSAGES.PASS_REQUIRED;
      req.session.field = 'all';
      return res.redirect('/account');
    }
    const userId = req.session.user;
    const user = await userServices.findUserById(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      req.session.message = MESSAGES.PASSWORD_MISMATCH;
      req.session.field = 'currentPassword';
      return res.redirect('/account');
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      req.session.message = MESSAGES.ISSAME_PASS;
      req.session.field = 'newPassword';
      return res.redirect('/account');
    }
    if (!userServices.isStrongPassword(newPassword)) {
      req.session.message = MESSAGES.PASSWORD_INVALID;
      req.session.field = 'newPassword';
      return res.redirect('/account');
    }
    if (newPassword !== confirmPassword) {
      req.session.message = MESSAGES.NEWPASS_MISSMATCH;
      req.session.field = 'confirmPassword';
      return res.redirect('/account');
    }
    await userServices.updatePassword(userId, newPassword);
    req.session.message = MESSAGES.ACC_PASS_CHANGED_;
    req.session.field = null;
    return res.redirect('/account');
  } catch (error) {
    console.log(error);
    req.session.message = error;
    req.session.field = null;
    res.redirect('/account');
  }
};

module.exports = {
  loadAccount,
  updateProfile,
  uploadProfileImage,
  removeProfileImage,
  loadChangeEmail,
  changeEmailOtp,
  changePassword,
};
