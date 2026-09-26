const SystemSettings = require('../models/SystemSettings');

// GET /api/system-settings (Public)
const getSystemSettings = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne({ setting_id: 'singleton' });
    if (!settings) {
      settings = await SystemSettings.create({ setting_id: 'singleton', register_page_enabled: true });
    }
    // Return only non-sensitive data
    res.status(200).json({
      register_page_enabled: settings.register_page_enabled
    });
  } catch (error) {
    next ? next(error) : res.status(500).json({ message: 'Server Error' });
  }
};

// PUT /api/system-settings/register-page (Admin only)
const updateRegisterPageSetting = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'enabled must be a boolean' });
    }

    let settings = await SystemSettings.findOne({ setting_id: 'singleton' });
    if (!settings) {
      settings = new SystemSettings({ setting_id: 'singleton' });
    }

    settings.register_page_enabled = enabled;
    settings.updated_by = req.user.userId;
    await settings.save();

    res.status(200).json({
      message: enabled ? 'Registration page is now visible' : 'Registration page is now hidden',
      register_page_enabled: settings.register_page_enabled
    });
  } catch (error) {
    next ? next(error) : res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getSystemSettings,
  updateRegisterPageSetting
};
