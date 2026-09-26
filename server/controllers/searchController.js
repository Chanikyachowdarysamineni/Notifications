const User = require('../models/User');

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    const regex = new RegExp(q, 'i');

    const users = await User.find({
      $or: [
        { name: regex },
        { reg_no: regex },
        { employee_id: regex }
      ]
    })
    .select('role name reg_no employee_id designation profile_image_url year section')
    .populate('year', 'name')
    .populate('section', 'name')
    .limit(20)
    .lean();

    const formattedResults = users.map(user => {
      const type = user.role === 'student' ? 'student' : 'staff';
      const identifier = type === 'student' ? user.reg_no : user.employee_id;
      return {
        id: user._id,
        type,
        name: user.name,
        identifier,
        designation: user.designation,
        year: user.year,
        section: user.section,
        avatar_url: user.profile_image_url
      };
    });

    res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { searchUsers };
