const Year = require('../models/Year');
const Section = require('../models/Section');

const validateAndCleanTargetAudience = async (target_all, target_year = [], target_section = []) => {
  // If target_all is true (or passed as string "true"), ignore specific selections
  if (target_all === true || target_all === 'true') {
    return { target_all: true, target_year: [], target_section: [] };
  }

  // Parse strings to arrays if necessary
  let parsedYears = typeof target_year === 'string' ? JSON.parse(target_year) : (target_year || []);
  let parsedSections = typeof target_section === 'string' ? JSON.parse(target_section) : (target_section || []);

  if (!Array.isArray(parsedYears)) parsedYears = [parsedYears];
  if (!Array.isArray(parsedSections)) parsedSections = [parsedSections];

  // No selection means target_all is implicitly true (send to all)
  if (parsedYears.length === 0 && parsedSections.length === 0) {
    return { target_all: true, target_year: [], target_section: [] };
  }

  // Verify that every provided Year ID actually exists
  const existingYears = await Year.find({ _id: { $in: parsedYears } }).select('_id');
  if (existingYears.length !== parsedYears.length) {
    throw new Error('One or more invalid Year IDs provided.');
  }

  // Verify that every provided Section ID actually exists and belongs to a provided Year
  if (parsedSections.length > 0) {
    const existingSections = await Section.find({ _id: { $in: parsedSections } }).select('_id year_id');
    if (existingSections.length !== parsedSections.length) {
      throw new Error('One or more invalid Section IDs provided.');
    }

    const validYearIds = new Set(parsedYears.map(id => id.toString()));
    for (const section of existingSections) {
      if (!validYearIds.has(section.year_id.toString())) {
        throw new Error(`Section mismatch: Section ${section._id} does not belong to any of the selected Years.`);
      }
    }
  }

  return { target_all: false, target_year: parsedYears, target_section: parsedSections };
};

const getTargetFeedQuery = (user) => {
  return {
    $or: [
      { target_all: true },
      { target_year: user.year, target_section: user.section }
    ]
  };
};

module.exports = {
  validateAndCleanTargetAudience,
  getTargetFeedQuery
};
