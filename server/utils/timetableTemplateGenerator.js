const XLSX = require('xlsx');
const Year = require('../models/Year');
const Section = require('../models/Section');
const User = require('../models/User');

/**
 * Generates an Excel (.xlsx) template buffer containing dynamic dropdowns/references
 * for Years, Sections, and Faculty in the system.
 */
async function generateTimeTableTemplate() {
  const [years, sections, facultyUsers] = await Promise.all([
    Year.find().sort({ name: 1 }),
    Section.find().populate('year').sort({ name: 1 }),
    User.find({ role: { $in: ['faculty', 'admin', 'deo'] } }).select('name email employee_id').sort({ name: 1 })
  ]);

  // Determine realistic sample values
  const sampleYear = years.length > 0 ? years[0].name : '2';
  const sampleSections = sections.filter(s => s.year && s.year.name === sampleYear);
  const sampleSecName = sampleSections.length > 0 ? sampleSections[0].name : (sections.length > 0 ? sections[0].name : 'A');
  const sampleFacultyEmail = facultyUsers.length > 0 ? facultyUsers[0].email : 'faculty1@cse.edu';
  const sampleFacultyEmail2 = facultyUsers.length > 1 ? facultyUsers[1].email : (facultyUsers.length > 0 ? facultyUsers[0].email : 'faculty2@cse.edu');

  // Sheet 1: TimeTable Upload Template
  const templateHeaders = [
    'Year',
    'Section',
    'Day',
    'Period No',
    'Start Time',
    'End Time',
    'Subject',
    'Faculty Email'
  ];

  const templateData = [
    templateHeaders,
    // Example Rows clearly marked
    [
      sampleYear,
      sampleSecName,
      'Mon',
      1,
      '09:00',
      '09:50',
      'Data Structures (EXAMPLE — DELETE THIS ROW)',
      sampleFacultyEmail
    ],
    [
      sampleYear,
      sampleSecName,
      'Mon',
      2,
      '09:50',
      '10:40',
      'DBMS (EXAMPLE — DELETE THIS ROW)',
      sampleFacultyEmail2
    ]
  ];

  const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);

  // Column widths
  wsTemplate['!cols'] = [
    { wch: 8 },  // Year
    { wch: 10 }, // Section
    { wch: 8 },  // Day
    { wch: 12 }, // Period No
    { wch: 12 }, // Start Time
    { wch: 12 }, // End Time
    { wch: 40 }, // Subject
    { wch: 30 }, // Faculty Email
  ];

  // Sheet 2: ReferenceData (System valid values)
  const refHeaders = ['Valid Years', 'Year', 'Valid Section', 'Faculty Name', 'Faculty Email', 'Employee ID'];
  const maxRows = Math.max(years.length, sections.length, facultyUsers.length, 1);
  const refData = [refHeaders];

  for (let i = 0; i < maxRows; i++) {
    const y = years[i]?.name || '';
    const s = sections[i];
    const sYear = s?.year?.name || '';
    const sName = s?.name || '';
    const f = facultyUsers[i];
    const fName = f?.name || '';
    const fEmail = f?.email || '';
    const fEmp = f?.employee_id || '';

    refData.push([y, sYear, sName, fName, fEmail, fEmp]);
  }

  const wsRef = XLSX.utils.aoa_to_sheet(refData);
  wsRef['!cols'] = [
    { wch: 14 },
    { wch: 8 },
    { wch: 16 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 }
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'TimeTable Template');
  XLSX.utils.book_append_sheet(wb, wsRef, 'ReferenceData');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

module.exports = {
  generateTimeTableTemplate
};
