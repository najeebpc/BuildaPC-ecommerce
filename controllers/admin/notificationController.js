const MESSAGES = require('../../constants/messages');
const STATUS = require('../../constants/statusCode');
const notificationServices = require('../../services/admin/notificationServices');

const getNotifications = async (req, res) => {
  try {
    const notifications = await notificationServices.getNotifications();
    return res.status(STATUS.OK).json({
      success: true,
      notifications,
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to load notifications',
    });
  }
};
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await notificationServices.markAsRead(notificationId);

    return res.status(STATUS.OK).json({
      success: true,
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to mark notification as read',
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
