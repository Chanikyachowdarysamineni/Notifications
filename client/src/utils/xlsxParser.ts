import * as XLSX from 'xlsx';

export const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to convert Excel decimal time or string to HH:mm (24-hour)
export function normalizeTimeString(val) {
  if (val === null || val === undefined || val === '') return '';
  
  if (typeof val === 'number') {
    // Excel fractional day (0 = 00:00, 0.5 = 12:00)
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const str = String(val).trim();
  // Check if standard HH:mm or H:mm
  const match24 = str.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (match24) {
    const hours = String(match24[1]).padStart(2, '0');
    const minutes = String(match24[2]).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Check 12-hour AM/PM format
  const match12 = str.match(/^([0-1]?[0-9]):([0-5][0-9])\s*(AM|PM|am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const modifier = match12[3].toUpperCase();
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  return str;
}

// Convert HH:mm to minutes for comparison
export function timeToMinutes(timeStr) {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function normalizeDay(val) {
  if (!val) return '';
  const s = String(val).trim();
  const found = VALID_DAYS.find(d => d.toLowerCase() === s.toLowerCase());
  return found || s;
}

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Parse Excel / CSV ArrayBuffer into validated timetable rows for preview.
 * @param {ArrayBuffer|Uint8Array} inputData 
 * @returns {{ rows: Array, errors: Array, totalDetected: number, isValid: boolean, summary: Object }}
 */
export function parseTimeTableSheet(inputData) {
  const workbook = XLSX.read(inputData, { type: 'array' });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return {
      rows: [],
      errors: [{ row: 0, message: 'Workbook contains no sheets.' }],
      totalDetected: 0,
      isValid: false,
      summary: {}
    };
  }

  let sheetName = workbook.SheetNames[0];
  if (sheetName.toLowerCase() === 'referencedata' && workbook.SheetNames.length > 1) {
    sheetName = workbook.SheetNames[1];
  }
  const sheet = workbook.Sheets[sheetName];
  const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

  const rows = [];
  const errors = [];
  const seenSlotMap = new Map();
  const sectionsSet = new Set();
  const daysSet = new Set();

  rawJson.forEach((rowObj, index) => {
    const excelRowNum = index + 2;

    const normalizedRow = {};
    for (const key of Object.keys(rowObj)) {
      const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
      normalizedRow[cleanKey] = rowObj[key];
    }

    const rawYear = normalizedRow['year'] ?? '';
    const rawSection = normalizedRow['section'] ?? normalizedRow['sec'] ?? '';
    const rawDay = normalizedRow['day'] ?? '';
    const rawPeriodNo = normalizedRow['periodno'] ?? normalizedRow['period'] ?? '';
    const rawStartTime = normalizedRow['starttime'] ?? normalizedRow['start'] ?? '';
    const rawEndTime = normalizedRow['endtime'] ?? normalizedRow['end'] ?? '';
    const rawSubject = normalizedRow['subject'] ?? normalizedRow['coursename'] ?? '';
    const rawFacultyEmail = normalizedRow['facultyemail'] ?? normalizedRow['email'] ?? '';

    const allEmpty = !rawYear && !rawSection && !rawDay && !rawPeriodNo && !rawSubject && !rawFacultyEmail;
    if (allEmpty) return;

    const combinedText = `${rawYear} ${rawSection} ${rawSubject} ${rawFacultyEmail}`.toUpperCase();
    if (combinedText.includes('EXAMPLE') || combinedText.includes('DELETE THIS ROW')) {
      return;
    }

    const yearStr = String(rawYear).trim();
    const sectionStr = String(rawSection).trim().toUpperCase();
    const dayStr = normalizeDay(rawDay);
    const periodNo = parseInt(String(rawPeriodNo).trim(), 10);
    const startTime = normalizeTimeString(rawStartTime);
    const endTime = normalizeTimeString(rawEndTime);
    const subject = String(rawSubject).trim();
    const facultyEmail = String(rawFacultyEmail).trim().toLowerCase();

    const rowErrors = [];

    if (!yearStr) {
      rowErrors.push('Year is required.');
    } else if (!['1', '2', '3', '4', 1, 2, 3, 4].includes(yearStr)) {
      rowErrors.push(`Invalid Year '${yearStr}'. Must be 1, 2, 3, or 4.`);
    }

    if (!sectionStr) {
      rowErrors.push('Section is required.');
    }

    if (!dayStr) {
      rowErrors.push('Day is required.');
    } else if (!VALID_DAYS.includes(dayStr)) {
      rowErrors.push(`Invalid Day '${rawDay}'. Must be one of: ${VALID_DAYS.join(', ')}.`);
    }

    if (isNaN(periodNo) || periodNo <= 0) {
      rowErrors.push(`Invalid Period No '${rawPeriodNo}'. Must be a positive integer.`);
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (!startTime || startMins === null) {
      rowErrors.push(`Invalid Start Time '${rawStartTime}'. Must be in HH:mm 24-hr format (e.g., 09:00).`);
    }
    if (!endTime || endMins === null) {
      rowErrors.push(`Invalid End Time '${rawEndTime}'. Must be in HH:mm 24-hr format (e.g., 09:50).`);
    }
    if (startMins !== null && endMins !== null && endMins <= startMins) {
      rowErrors.push(`End Time (${endTime}) must be strictly after Start Time (${startTime}).`);
    }

    if (!subject) {
      rowErrors.push('Subject name is required.');
    }

    if (!facultyEmail) {
      rowErrors.push('Faculty Email is required.');
    } else if (!isValidEmail(facultyEmail)) {
      rowErrors.push(`Invalid Faculty Email format '${rawFacultyEmail}'.`);
    }

    const slotKey = `${yearStr}_${sectionStr}_${dayStr}_${periodNo}`;
    if (seenSlotMap.has(slotKey)) {
      const prevRow = seenSlotMap.get(slotKey);
      rowErrors.push(`Duplicate Period No ${periodNo} for Year ${yearStr} Section ${sectionStr} on ${dayStr} (already defined on Row ${prevRow}).`);
    } else {
      seenSlotMap.set(slotKey, excelRowNum);
    }

    const cleanRow = {
      rowNumber: excelRowNum,
      year: yearStr,
      section: sectionStr,
      day: dayStr,
      period_no: periodNo,
      start_time: startTime,
      end_time: endTime,
      subject,
      faculty_email: facultyEmail,
      errors: rowErrors
    };

    if (rowErrors.length > 0) {
      rowErrors.forEach(msg => {
        errors.push({ row: excelRowNum, message: `Row ${excelRowNum}: ${msg}` });
      });
    }

    rows.push(cleanRow);
    if (yearStr && sectionStr) sectionsSet.add(`Year ${yearStr} - Section ${sectionStr}`);
    if (dayStr) daysSet.add(dayStr);
  });

  return {
    rows,
    errors,
    totalDetected: rows.length,
    validRowCount: rows.filter(r => r.errors.length === 0).length,
    invalidRowCount: rows.filter(r => r.errors.length > 0).length,
    isValid: errors.length === 0 && rows.length > 0,
    summary: {
      totalRows: rows.length,
      sectionsCount: sectionsSet.size,
      sectionsList: Array.from(sectionsSet),
      daysCovered: Array.from(daysSet)
    }
  };
}
