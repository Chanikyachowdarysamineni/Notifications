const mongoose = require('mongoose');
const Year = require('../models/Year');
const Section = require('../models/Section');
const User = require('../models/User');
const TimeTable = require('../models/TimeTable');
const UploadLog = require('../models/UploadLog');
const { generateTimeTableTemplate } = require('../utils/timetableTemplateGenerator');
const { parseTimeTableSheet } = require('../utils/xlsxParser');

// GET /api/timetable/template (Admin / DEO only)
const getTimetableTemplate = async (req, res, next) => {
  try {
    const buffer = await generateTimeTableTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="timetable_template.xlsx"');
    return res.send(buffer);
  } catch (error) {
    console.error('Error generating timetable template:', error);
    next(error);
  }
};

// POST /api/timetable/bulk-upload (Admin / DEO only)
const bulkUploadTimeTable = async (req, res, next) => {
  try {
    let rowsToProcess = [];
    let parsingErrors = [];

    // 1. Check if rows were sent pre-parsed as JSON, or if a raw file was uploaded
    if (req.body.rows && Array.isArray(req.body.rows)) {
      rowsToProcess = req.body.rows;
    } else if (req.file && req.file.buffer) {
      const parsed = parseTimeTableSheet(req.file.buffer);
      rowsToProcess = parsed.rows;
      parsingErrors = parsed.errors;
    } else {
      return res.status(400).json({
        success: false,
        message: 'No timetable rows or spreadsheet file provided.'
      });
    }

    if (parsingErrors.length > 0) {
      return res.status(400).json({
        success: false,
        validRowCount: 0,
        invalidRowCount: rowsToProcess.length,
        errors: parsingErrors
      });
    }

    if (rowsToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded file does not contain any timetable data rows.'
      });
    }

    // 2. Load system references for server-side validation
    const [years, sections, facultyUsers] = await Promise.all([
      Year.find(),
      Section.find().populate('year'),
      User.find({ role: { $in: ['faculty', 'admin', 'deo'] } }).select('email _id name')
    ]);

    const yearMap = new Map(); // name -> Year doc
    years.forEach(y => yearMap.set(String(y.name).trim(), y));

    const sectionMap = new Map(); // `${yearName}_${sectionName}` -> Section doc
    sections.forEach(s => {
      if (s.year && s.year.name) {
        const key = `${String(s.year.name).trim()}_${String(s.name).trim().toUpperCase()}`;
        sectionMap.set(key, s);
      }
    });

    const facultyMap = new Map(); // email -> User doc
    facultyUsers.forEach(f => {
      if (f.email) {
        facultyMap.set(f.email.trim().toLowerCase(), f);
      }
    });

    // 3. Server-side row validation
    const validationErrors = [];
    const validGroupedSlots = new Map(); // key: `${yearId}_${sectionId}_${day}` -> { yearId, sectionId, day, yearName, sectionName, periods: [] }

    rowsToProcess.forEach((row, idx) => {
      const rowNum = row.rowNumber || (idx + 2);
      const yearStr = String(row.year || '').trim();
      const sectionStr = String(row.section || '').trim().toUpperCase();
      const day = String(row.day || '').trim();
      const facultyEmail = String(row.faculty_email || '').trim().toLowerCase();
      const subject = String(row.subject || '').trim();
      const startTime = String(row.start_time || '').trim();
      const endTime = String(row.end_time || '').trim();
      const periodNo = parseInt(row.period_no, 10);

      // Validate Year
      const yearDoc = yearMap.get(yearStr);
      if (!yearDoc) {
        validationErrors.push({
          row: rowNum,
          message: `Row ${rowNum}: Year '${yearStr}' does not exist in the system database.`
        });
      }

      // Validate Section
      const secKey = `${yearStr}_${sectionStr}`;
      const sectionDoc = sectionMap.get(secKey);
      if (!sectionDoc) {
        validationErrors.push({
          row: rowNum,
          message: `Row ${rowNum}: Section '${sectionStr}' does not exist for Year ${yearStr}.`
        });
      }

      // Validate Faculty Email
      const facultyDoc = facultyMap.get(facultyEmail);
      if (!facultyDoc) {
        validationErrors.push({
          row: rowNum,
          message: `Row ${rowNum}: Faculty user with email '${facultyEmail}' was not found.`
        });
      }

      // If all reference lookups succeeded for this row, stage it
      if (yearDoc && sectionDoc && facultyDoc) {
        const groupKey = `${yearDoc._id.toString()}_${sectionDoc._id.toString()}_${day}`;
        if (!validGroupedSlots.has(groupKey)) {
          validGroupedSlots.set(groupKey, {
            yearId: yearDoc._id,
            sectionId: sectionDoc._id,
            yearName: yearDoc.name,
            sectionName: sectionDoc.name,
            day,
            periods: []
          });
        }

        validGroupedSlots.get(groupKey).periods.push({
          period_no: periodNo,
          subject,
          faculty_id: facultyDoc._id,
          start_time: startTime,
          end_time: endTime
        });
      }
    });

    // If ANY row failed validation, reject the entire batch (all-or-nothing guarantee)
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        validRowCount: rowsToProcess.length - validationErrors.length,
        invalidRowCount: validationErrors.length,
        errors: validationErrors
      });
    }

    // 4. Upsert Strategy: Overwrite/replace the periods for each Year+Section+Day combination
    const affectedSections = [];
    let totalPeriodsInserted = 0;

    // Sort periods inside each group by period_no
    for (const group of validGroupedSlots.values()) {
      group.periods.sort((a, b) => a.period_no - b.period_no);

      const periodDocs = group.periods.map(p => ({
        subject: p.subject,
        faculty_id: p.faculty_id,
        start_time: p.start_time,
        end_time: p.end_time
      }));

      await TimeTable.findOneAndUpdate(
        { year: group.yearId, section: group.sectionId, day: group.day },
        { periods: periodDocs },
        { upsert: true, returnDocument: 'after', runValidators: true }
      );

      totalPeriodsInserted += periodDocs.length;
      affectedSections.push({
        year: group.yearName,
        section: group.sectionName,
        day: group.day,
        period_count: periodDocs.length
      });
    }

    // 5. Create audit log
    await UploadLog.create({
      uploaded_by: req.user.userId,
      uploader_role: req.user.role,
      type: 'timetable',
      file_name: req.file?.originalname || 'bulk_upload.xlsx',
      total_rows: rowsToProcess.length,
      sections_affected: affectedSections,
      status: 'success',
      summary: {
        totalPeriodsInserted,
        combinationsUpdated: validGroupedSlots.size
      }
    });

    // Unique Year + Section labels
    const uniqueSectionsUpdated = Array.from(
      new Set(affectedSections.map(s => `Year ${s.year} - Section ${s.section}`))
    );

    return res.status(200).json({
      success: true,
      message: 'Time Table uploaded and synced successfully.',
      summary: {
        yearsSectionsUpdated: uniqueSectionsUpdated,
        totalPeriodsInserted,
        totalSlotsUpdated: validGroupedSlots.size
      }
    });

  } catch (error) {
    console.error('Error during timetable bulk upload:', error);
    next(error);
  }
};

// GET /api/timetable/sections-summary?year=X
const getSectionsSummary = async (req, res, next) => {
  try {
    const { year: yearQuery } = req.query;

    let yearFilter = {};
    if (yearQuery) {
      if (mongoose.Types.ObjectId.isValid(yearQuery)) {
        yearFilter = { _id: yearQuery };
      } else {
        yearFilter = { name: yearQuery };
      }
    }

    const yearDoc = yearQuery ? await Year.findOne(yearFilter) : await Year.findOne().sort({ name: 1 });
    if (!yearDoc) {
      return res.status(200).json({ sections: [] });
    }

    const sections = await Section.find({ year: yearDoc._id }).sort({ name: 1 });
    const sectionSummaries = await Promise.all(
      sections.map(async (sec) => {
        const timetables = await TimeTable.find({ year: yearDoc._id, section: sec._id });
        const daysConfigured = timetables.filter(t => t.periods && t.periods.length > 0).map(t => t.day);
        const totalPeriods = timetables.reduce((acc, curr) => acc + (curr.periods?.length || 0), 0);

        return {
          _id: sec._id,
          name: sec.name,
          hasTimeTable: daysConfigured.length > 0,
          daysConfigured,
          totalPeriods
        };
      })
    );

    return res.status(200).json({
      yearId: yearDoc._id,
      yearName: yearDoc.name,
      sections: sectionSummaries
    });
  } catch (error) {
    console.error('Error fetching timetable sections summary:', error);
    next(error);
  }
};

module.exports = {
  getTimetableTemplate,
  bulkUploadTimeTable,
  getSectionsSummary
};
