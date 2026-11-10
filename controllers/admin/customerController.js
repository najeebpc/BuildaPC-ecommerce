const User = require('../../model/userSchema');
const mongoose = require('mongoose');

const loadUsers = async (req, res) => {
  try {
    const admin = req.session.admin;
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const query = {
      isAdmin: false,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };
    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);
    res.render('admin/users', {
      users,
      search,
      currentPage: page,
      totalPages,
      active: 'users',
      admin,
    });
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
};
const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, {
      isBlocked: true,
    });
    res.redirect('/admin/users');
  } catch (error) {
    res.redirect('/admin/users');
  }
};
const unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, {
      isBlocked: false,
    });
    res.redirect('/admin/users');
  } catch (error) {
    res.redirect('admin/users');
  }
};

module.exports = {
  loadUsers,
  blockUser,
  unblockUser,
};
