const User = require('../models/User');
const EventRegistration = require('../models/EventRegistration');
const Section = require('../models/Section');
const { ROLES } = require('../config/constants');

// @route   GET /api/students/:studentId
// @desc    Get student details with context
// @access  Admin, DEO, Faculty
const getStudentById = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({ _id: studentId, role: ROLES.STUDENT })
      .populate('year', 'name')
      .populate('section', 'name');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Fetch recent event registrations (last 5)
    const recentEvents = await EventRegistration.find({ user: studentId })
      .populate('event', 'title date')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        reg_no: student.reg_no,
        mobile: student.mobile,
        dob: student.dob,
        cgpa: student.cgpa,
        year: student.year,
        section: student.section,
        profile_image_url: student.profile_image_url,
        is_first_login: student.is_first_login,
      },
      recentEvents: recentEvents.map(reg => reg.event)
    });
  } catch (err) {
    next(err);
  }
};

// @route   PATCH /api/students/:studentId
// @desc    Update student details (Full field edit)
// @access  Admin, DEO
const updateStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const updateData = req.body;

    const student = await User.findOne({ _id: studentId, role: ROLES.STUDENT });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Validate email uniqueness if changed
    if (updateData.email && updateData.email !== student.email) {
      const existing = await User.findOne({ email: updateData.email });
      if (existing) {
        console.log('[DEBUG] Failed at email uniqueness');
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
    }

    // Validate Year/Section pairing
    if (updateData.year || updateData.section) {
      const targetYear = updateData.year || student.year;
      const targetSection = updateData.section || student.section;
      
      const sectionValid = await Section.findOne({ _id: targetSection, year: targetYear });
      if (!sectionValid) {
        console.log(`[DEBUG] Failed at Year/Section pair. Year: ${targetYear}, Section: ${targetSection}`);
        return res.status(400).json({ message: 'Invalid Year/Section combination' });
      }
      
      // Basic Audit Logging equivalent
      if (student.section?.toString() !== targetSection?.toString()) {
        console.log(`[AUDIT] Student ${student.reg_no} section changed from ${student.section} to ${targetSection}`);
      }
    }

    if (updateData.cgpa !== undefined) {
      if (updateData.cgpa !== null && updateData.cgpa !== '' && (updateData.cgpa < 0 || updateData.cgpa > 10)) {
        console.log(`[DEBUG] Failed at CGPA validation. value: ${updateData.cgpa}`);
        return res.status(400).json({ message: 'CGPA must be between 0.0 and 10.0' });
      }
    }

    // Allowed fields for Admin/DEO edit
    const allowedFields = ['name', 'email', 'mobile', 'dob', 'reg_no', 'cgpa', 'year', 'section'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        student[field] = updateData[field];
      }
    });

    await student.save();

    const updatedStudent = await User.findById(studentId)
      .populate('year', 'name')
      .populate('section', 'name');

    res.json(updatedStudent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudentById,
  updateStudent
};
