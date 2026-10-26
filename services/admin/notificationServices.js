
const Notification = require('../../model/notificationSchema');

const createNotification = async (title, message) => {
    return await Notification.create({
        title,
        message
    });
};
const getNotifications = async () => {
    return await Notification.find()
        .sort({ createdAt: -1 })
        .lean();
};
const markAsRead = async (notificationId) => {
    const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        throw new Error('Notification not found');
    }

    return notification;
};
module.exports = {
    createNotification,
    getNotifications,
    markAsRead
};
