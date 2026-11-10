const Address = require('../../model/addressSchema');
const User = require('../../model/userSchema.js');
const userServices = require('../../services/user/userServices');
const addressServices = require('../../services//user/addressServices');
const STATUS = require('../../constants/statusCode');
const MESSAGES = require('../../constants/messages');

const loadAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await userServices.findUserById(userId);
    const addresses = await addressServices.getUserAddress(userId);
    res.render('user/address', {
      user,
      addresses,
    });
  } catch (error) {
    console.error(error);
    res.redirect('/account');
  }
};
const addAddress = async (req, res) => {
  try {
    const userId = req.session.user;

    console.log('user id', userId);
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode } = req.body;
    const newAddress = await addressServices.createAddress({
      userId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    });
    if (req.headers.accept?.includes('application/json')) {
      return res.status(STATUS.CREATED).json({
        success: true,
        message: MESSAGES.ADDRESS_ADDED,
        address: newAddress,
      });
    }
    return res.redirect('/account/address');
  } catch (error) {
    console.log('error adding address');
    console.log(error);
    if (req.headers.accept?.includes('application/json')) {
      return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.ADDRESS_ERROR,
      });
    }
    return res.redirect('/account/address');
  }
};
const getAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const addressId = req.params.id;
    const address = await addressServices.getAddress(addressId, userId);

    if (!address) {
      return res.status(STATUS.NOT_FOUND).json(MESSAGES.ADDRESS_NOT_FOUND);
    }
    res.json(address);
  } catch (error) {
    console.log('error getting address');
    res.status(STATUS.NOT_FOUND).json(MESSAGES.SOMETHING_WENT_WRONG);
  }
};
const editAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const addressId = req.params.id;
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode } = req.body;
    const updatedAddress = await addressServices.updateAddress(
      addressId,
      userId,
      {
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
      { new: true, runValidators: true },
    );
    if (!updatedAddress) {
      return res.redirect('/account/address');
    }
    res.redirect('/account/address');
  } catch (error) {
    console.log(error);
    return res.redirect('/account/address');
  }
};
const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const addressId = req.params.id;
    const deleteAddress = await addressServices.deleteAddress(addressId, userId);
    if (!deleteAddress) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ADDRESS_NOT_FOUND,
      });
    }
    return res.json({
      success: true,
      message: MESSAGES.ADDRESS_DELETED,
    });
  } catch (error) {
    console.log('Error deleting address', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SOMETHING_WENT_WRONG,
    });
  }
};
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const { addressId } = req.params;
    const address = await addressServices.setDefaultAddress(addressId, userId);
    if (!address) {
      return res
        .status(STATUS.NOT_FOUND)
        .json({ success: false, message: MESSAGES.ADDRESS_NOT_FOUND });
    }
    return res.json({
      success: true,
      message: MESSAGES.ADDRESS_UPDATED,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).jso({
      success: false,
      message: MESSAGES.SOMETHING_WENT_WRONG,
    });
  }
};
module.exports = {
  loadAddress,
  addAddress,
  getAddress,
  editAddress,
  deleteAddress,
  setDefaultAddress,
};
