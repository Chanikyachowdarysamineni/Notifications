import React from 'react';
import { AlertCircle, CheckCircle2, ArrowLeft, Upload, FileSpreadsheet } from 'lucide-react';

export default function TimeTableUploadPreview({ 
  parseResult, 
  onBack, 
  onConfirm, 
  isSubmitting 
}) {
  const { rows, errors, validRowCount, invalidRowCount, summary, isValid } = parseResult;
  const previewRows = rows.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 font-medium">Total Detected</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{rows.length} rows</p>
        </div>

        <div className="p-3.5 bg-green-50/60 dark:bg-green-950/20 rounded-2xl border border-green-100 dark:border-green-900/30">
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Valid Rows</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">{validRowCount}</p>
        </div>

        <div className={`p-3.5 rounded-2xl border ${
          invalidRowCount > 0 
            ? 'bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/30' 
            : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800'
        }`}>
          <p className={`text-xs font-medium ${invalidRowCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
            Invalid Rows
          </p>
          <p className={`text-xl font-bold mt-1 ${invalidRowCount > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-white'}`}>
            {invalidRowCount}
          </p>
        </div>

        <div className="p-3.5 bg-brand-50/60 dark:bg-brand-950/20 rounded-2xl border border-brand-100 dark:border-brand-900/30">
          <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">Sections Target</p>
          <p className="text-xl font-bold text-brand-700 dark:text-brand-300 mt-1">{summary.sectionsCount || 0}</p>
        </div>
      </div>

      {/* Sections & Days Tag Pills */}
      {summary.sectionsList && summary.sectionsList.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Target Sections:</span>
          {summary.sectionsList.map((sec, i) => (
            <span key={i} className="px-2.5 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-full font-medium">
              {sec}
            </span>
          ))}
          <span className="ml-2 font-semibold text-gray-700 dark:text-gray-300">Days:</span>
          {summary.daysCovered.map((d, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-md font-medium">
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Validation Errors Box */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold text-sm">
            <AlertCircle size={18} />
            <span>{errors.length} Validation Error{errors.length > 1 ? 's' : ''} Detected (Upload Blocked)</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs text-red-600 dark:text-red-300/90 pr-2">
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="font-bold">•</span>
                <span>{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-brand-500" />
            File Preview {rows.length > 20 && <span className="text-xs text-gray-400 font-normal">(Showing first 20 of {rows.length} rows)</span>}
          </h4>
          {isValid ? (
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Ready to commit
            </span>
          ) : (
            <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
              <AlertCircle size={14} /> Fix errors to proceed
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 max-h-96 overflow-y-auto">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Row</th>
                  <th className="py-2.5 px-3 font-semibold">Year</th>
                  <th className="py-2.5 px-3 font-semibold">Sec</th>
                  <th className="py-2.5 px-3 font-semibold">Day</th>
                  <th className="py-2.5 px-3 font-semibold">Period</th>
                  <th className="py-2.5 px-3 font-semibold">Time</th>
                  <th className="py-2.5 px-3 font-semibold">Subject</th>
                  <th className="py-2.5 px-3 font-semibold">Faculty Email</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 bg-white dark:bg-gray-950">
                {previewRows.map((row: any, idx) => {
                  const hasErr = row.errors && row.errors.length > 0;
                  return (
                    <tr 
                      key={idx} 
                      className={`transition-colors ${
                        hasErr ? 'bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200' : 'hover:bg-gray-50 dark:hover:bg-gray-900/40 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono font-medium">{row.rowNumber}</td>
                      <td className="py-2 px-3">{row.year}</td>
                      <td className="py-2 px-3 font-semibold">{row.section}</td>
                      <td className="py-2 px-3">{row.day}</td>
                      <td className="py-2 px-3 font-mono">{row.period_no}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{row.start_time} - {row.end_time}</td>
                      <td className="py-2 px-3 font-medium truncate max-w-[150px]" title={row.subject}>{row.subject}</td>
                      <td className="py-2 px-3 text-gray-500 dark:text-gray-400 truncate max-w-[160px]" title={row.faculty_email}>{row.faculty_email}</td>
                      <td className="py-2 px-3">
                        {hasErr ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-950">
            {previewRows.map((row: any, idx) => {
              const hasErr = row.errors && row.errors.length > 0;
              return (
                <div key={idx} className={`p-3 text-sm transition-colors ${hasErr ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Row {row.rowNumber}: <span className="font-bold text-brand-600 dark:text-brand-400">{row.subject}</span>
                    </div>
                    {hasErr ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Error</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Valid</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
                    <div><span className="font-semibold">Year/Sec:</span> {row.year} {row.section}</div>
                    <div><span className="font-semibold">Day:</span> {row.day}</div>
                    <div><span className="font-semibold">Period:</span> {row.period_no}</div>
                    <div><span className="font-semibold">Time:</span> {row.start_time} - {row.end_time}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 truncate"><span className="font-semibold">Faculty:</span> {row.faculty_email}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Choose Another File
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={!isValid || isSubmitting}
          className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-md ${
            isValid && !isSubmitting
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 active:scale-95'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing Upload...
            </>
          ) : (
            <>
              <Upload size={16} />
              Confirm & Save ({validRowCount} rows)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
