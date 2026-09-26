const TimeTable = require('../models/TimeTable');

// GET /api/timetable
const getTimeTable = async (req, res, next) => {
  try {
    const { year, section, day } = req.query;
    if (!year || !section) {
      return res.status(200).json([]);
    }

    const query = { year, section };
    if (day) {
      query.day = day;
    }

    const timetables = await TimeTable.find(query)
      .populate('periods.faculty_id', 'name employee_id email')
      .populate('year', 'name')
      .populate('section', 'name');

    res.status(200).json(timetables);
  } catch (error) {
    next ? next(error) : res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/timetable/:year/:section/:day
const saveTimeTable = async (req, res) => {
  try {
    const { year, section, day } = req.params;
    const { periods } = req.body; // Array of period objects

    if (!periods || !Array.isArray(periods)) {
      return res.status(400).json({ message: 'Periods array is required' });
    }

    // Check for faculty overlaps across other sections for the same day
    for (const p of periods) {
      if (p.faculty_id) {
        // Find if this faculty is already teaching another section at this exact time on this day
        const overlap = await TimeTable.findOne({
          day,
          $or: [
            { year: { $ne: year } },
            { section: { $ne: section } }
          ],
          periods: {
            $elemMatch: {
              faculty_id: p.faculty_id,
              start_time: p.start_time
            }
          }
        }).populate('year section');
        
        if (overlap) {
          const facultyObj = await require('../models/User').findById(p.faculty_id).select('name');
          const fName = facultyObj ? facultyObj.name : 'Selected faculty';
          return res.status(400).json({ 
            message: `Overlap detected: ${fName} is already assigned to ${overlap.year?.name || 'another year'} - ${overlap.section?.name || 'another section'} at ${p.start_time} on ${day}.` 
          });
        }
      }
    }

    // Upsert the timetable for this day
    const updatedTimeTable = await TimeTable.findOneAndUpdate(
      { year, section, day },
      { periods },
      { returnDocument: 'after', upsert: true, runValidators: true }
    ).populate('periods.faculty_id', 'name');

    res.status(200).json({
      message: 'Time table saved successfully',
      timetable: updatedTimeTable
    });
  } catch (error) {
    console.error('Save timetable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTimeTable,
  saveTimeTable
};
