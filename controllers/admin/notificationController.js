
const notificationServices = require('../../services/admin/notificationServices');

const getNotifications = async (req, res) => {
    try {
        const notifications =   await notificationServices.getNotifications();
        return res.status(200).json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to load notifications'
        });
    }
};
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        await notificationServices.markAsRead(notificationId);

        return res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);

        const statusCode =
            error.message === 'Notification not found' ? 404 : 500;

        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to mark notification as read'
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead
};
