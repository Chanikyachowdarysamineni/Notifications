const User = require('../models/User');
const Event = require('../models/Event');
const FileResource = require('../models/FileResource');
const TimeTable = require('../models/TimeTable');

const getDashboard = async (req, res) => {
  try {
    const { role, userId } = req.user;

    // Admin / DEO Dashboard
    if (role === 'admin' || role === 'deo') {
      // Parallelize queries for maximum performance (Phase 13 Optimization)
      const [students, faculty, events, files] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'faculty' }),
        Event.countDocuments({ event_date: { $gte: new Date() } }),
        FileResource.countDocuments()
      ]);

      return res.status(200).json({
        stats: { students, faculty, events, files }
      });
    } 
    
    // Faculty Dashboard
    if (role === 'faculty') {
      const todayShort = new Date().toLocaleDateString('en-US', { weekday: 'short' });
      
      const timetables = await TimeTable.find({ 
        day: todayShort, 
        'periods.faculty_id': userId 
      }).populate('year section');

      const todayClasses = [];
      timetables.forEach(tt => {
        tt.periods.forEach(p => {
          if (p.faculty_id.toString() === userId) {
            todayClasses.push({
              subject: p.subject,
              faculty_name: req.user.name,
              start_time: p.start_time
            });
          }
        });
      });

      return res.status(200).json({ todayClasses });
    }

    // Student Dashboard
    if (role === 'student') {
      const student = await User.findById(userId);
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const todayShort = new Date().toLocaleDateString('en-US', { weekday: 'short' });
      
      const timetable = await TimeTable.findOne({
        year: student.year,
        section: student.section,
        day: todayShort
      }).populate('periods.faculty_id', 'name');

      const todayClasses = timetable ? timetable.periods.map(p => ({
        subject: p.subject,
        faculty_name: p.faculty_id?.name || 'Unknown',
        start_time: p.start_time
      })) : [];

      return res.status(200).json({
        profileSummary: {
          name: student.name,
          reg_no: student.reg_no,
          cgpa: student.cgpa
        },
        todayClasses
      });
    }

    return res.status(403).json({ message: 'Invalid role for dashboard access' });
  } catch (error) {
    console.error('Dashboard Data Error:', error);
    res.status(500).json({ message: 'Server error retrieving dashboard data' });
  }
};

module.exports = {
  getDashboard
};
