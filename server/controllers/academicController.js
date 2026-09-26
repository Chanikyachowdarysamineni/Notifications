const Year = require('../models/Year');
const Section = require('../models/Section');
const User = require('../models/User');
const TimeTable = require('../models/TimeTable');

// PUBLIC READ ROUTES
const getYears = async (req, res) => {
  try {
    const years = await Year.find({});
    res.status(200).json(years);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getSections = async (req, res) => {
  try {
    const { year } = req.query;
    // If year is missing or 'all', return all sections
    const sections = year && year !== 'all'
      ? await Section.find({ year })
      : await Section.find({}).populate('year', 'name');
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// YEARS
const createYear = async (req, res) => {
  try {
    const { year_number, label } = req.body;
    const newYear = new Year({ year_number, name: label || `Year ${year_number}` }); // User.js actually references 'name' if I recall, but prompt says 'label'. I'll use both.
    await newYear.save();
    res.status(201).json(newYear);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateYear = async (req, res) => {
  try {
    const updated = await Year.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteYear = async (req, res) => {
  try {
    const yearId = req.params.id;
    const force = req.query.force === 'true';

    // Dependency check
    const studentsCount = await User.countDocuments({ year: yearId });
    const sectionsCount = await Section.countDocuments({ year: yearId });
    const timetableCount = await TimeTable.countDocuments({ year: yearId });

    if ((studentsCount > 0 || sectionsCount > 0 || timetableCount > 0) && !force) {
      return res.status(409).json({
        message: `Dependency conflict`,
        dependencies: { students: studentsCount, sections: sectionsCount, timetables: timetableCount }
      });
    }

    if (force) {
      await Section.deleteMany({ year: yearId });
      // Depending on business logic, maybe clear User years instead of deleting users
      await User.updateMany({ year: yearId }, { $unset: { year: 1, section: 1 } });
      await TimeTable.deleteMany({ year: yearId });
    }

    await Year.findByIdAndDelete(yearId);
    res.status(200).json({ message: 'Year deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// SECTIONS
const createSection = async (req, res) => {
  try {
    const { name, year_id } = req.body;
    const newSection = new Section({ name, year: year_id });
    await newSection.save();
    res.status(201).json(newSection);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateSection = async (req, res) => {
  try {
    const updated = await Section.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteSection = async (req, res) => {
  try {
    const sectionId = req.params.id;
    const force = req.query.force === 'true';

    const studentsCount = await User.countDocuments({ section: sectionId });
    const timetableCount = await TimeTable.countDocuments({ section: sectionId });

    if ((studentsCount > 0 || timetableCount > 0) && !force) {
      return res.status(409).json({
        message: `Dependency conflict`,
        dependencies: { students: studentsCount, timetables: timetableCount }
      });
    }

    if (force) {
      await User.updateMany({ section: sectionId }, { $unset: { section: 1 } });
      await TimeTable.deleteMany({ section: sectionId });
    }

    await Section.findByIdAndDelete(sectionId);
    res.status(200).json({ message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getYears, createYear, updateYear, deleteYear,
  getSections, createSection, updateSection, deleteSection
};
