const User = require('../../model/userSchema');
const bcrypt = require('bcrypt');

const findUser = async (email) => {
  return await User.findOne({ email });
};
const findUserByName = async (name) => {
  return await User.findOne({ name });
};
const findUserById = async (userId) => {
  return await User.findById(userId).lean();
};
const isValidEmail = (email) => {
  const emailRegex =
    /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
  if (!emailRegex.test(email.trim()) || email.trim().split('@')[0].length < 3) {
    return false;
  }
  return true;
};
const isStrongPassword = (password) => {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {}
};
const updateProfile = async (userId, profileData) => {
  return await User.findByIdAndUpdate(userId, profileData, { new: true });
};
const updatePassword = async (userId, password) => {
  const hashedPassword = await securePassword(password);
  return await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });
};
const updateProfileImage = async (userId, filename) => {
  return await User.findByIdAndUpdate(userId, { profileImage: filename }, { new: true });
};
const removeProfileImage = async (userId) => {
  return await User.findByIdAndUpdate(userId, { profileImage: null }, { new: true });
};
const updateUserEmail = async (userId, email) => {
  return await User.findByIdAndUpdate(userId, { email }, { new: true });
};

module.exports = {
  findUser,
  findUserById,
  findUserByName,
  isValidEmail,
  isStrongPassword,
  securePassword,
  updatePassword,
  updateProfile,
  updateProfileImage,
  removeProfileImage,
  updateUserEmail,
};
