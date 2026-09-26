const SystemSettings = require('../models/SystemSettings');

const checkRegisterPageEnabled = async (req, res, next) => {
  try {
    const settings = await SystemSettings.findOne({ setting_id: 'singleton' });
    
    // If not found, it defaults to true
    if (settings && settings.register_page_enabled === false) {
      return res.status(403).json({ 
        message: 'Registration is currently disabled by the administrator' 
      });
    }
    
    next();
  } catch (error) {
    next ? next(error) : res.status(500).json({ message: 'Server error' });
  }
};

module.exports = checkRegisterPageEnabled;
