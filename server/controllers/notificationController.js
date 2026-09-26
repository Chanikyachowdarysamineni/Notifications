const NotificationLog = require('../models/NotificationLog');

const getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationLog.find({ recipient: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await NotificationLog.countDocuments({ 
      recipient: req.user.userId, 
      is_read: false 
    });

    res.status(200).json({ unreadCount, notifications });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await NotificationLog.findOneAndUpdate(
      { _id: id, recipient: req.user.userId },
      { is_read: true },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await NotificationLog.updateMany(
      { recipient: req.user.userId, is_read: false },
      { is_read: true }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
