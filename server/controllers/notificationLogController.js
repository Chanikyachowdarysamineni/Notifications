const NotificationLog = require('../models/NotificationLog');

const getNotificationLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;

    const query = {};
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.sent_at = {};
      if (startDate) query.sent_at.$gte = new Date(startDate);
      if (endDate) query.sent_at.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await NotificationLog.find(query)
      .populate('recipient', 'name email role reg_no employee_id')
      .sort({ sent_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await NotificationLog.countDocuments(query);

    res.status(200).json({
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notification logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotificationLogs };
