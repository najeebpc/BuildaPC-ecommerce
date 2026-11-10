const Address = require('../../model/addressSchema');

const getUserAddress = async (userId) => {
  return await Address.find({ userId });
};
const createAddress = async (addressData) => {
  const address = new Address(addressData);
  return address.save();
};
const getAddress = async (addressId, userId) => {
  return await Address.findOne({
    _id: addressId,
    userId,
  }).lean();
};
const updateAddress = async (addressId, userId, addressData) => {
  return await Address.findOneAndUpdate(
    {
      _id: addressId,
      userId,
    },
    addressData,
    {
      new: true,
      runvalidators: true,
    },
  );
};
const deleteAddress = async (addressId, userId) => {
  return await Address.findOneAndDelete({
    _id: addressId,
    userId,
  });
};
const setDefaultAddress = async (addressId, userId) => {
  await Address.updateMany({ userId }, { $set: { isDefault: false } });
  return await Address.findOneAndUpdate(
    {
      _id: addressId,
      userId,
    },
    { $set: { isDefault: true } },
    { new: true },
  );
};
module.exports = {
  getUserAddress,
  createAddress,
  getAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
