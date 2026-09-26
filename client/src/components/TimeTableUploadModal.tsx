import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, FileSpreadsheet, Download, CheckCircle2, 
  AlertCircle, ChevronRight, RefreshCw, FileCheck
} from 'lucide-react';
import { parseTimeTableSheet } from '../utils/xlsxParser';
import TimeTableUploadPreview from './TimeTableUploadPreview';
import api from '../lib/axios';

export default function TimeTableUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const [step, setStep] = useState(1); // 1: Select File, 2: Preview, 3: Completed
  const [selectedFile, setSelectedFile] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/timetable/template', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'timetable_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download template error:', err);
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setIsParsing(true);
    setServerErrors([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = parseTimeTableSheet(arrayBuffer);
      setParseResult(result);
      setStep(2);
    } catch (error) {
      console.error('File parsing error:', error);
      setServerErrors([{ message: 'Failed to read spreadsheet file. Please verify it is a valid .xlsx or .csv format.' }]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConfirmUpload = async () => {
    if (!parseResult || !parseResult.rows) return;
    setIsSubmitting(true);
    setServerErrors([]);

    try {
      const res = await api.post('/timetable/bulk-upload', {
        rows: parseResult.rows
      });

      if (res.data?.success) {
        setUploadSummary(res.data.summary);
        setStep(3);
        if (onSuccess) {
          onSuccess(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      const responseErrors = err.response?.data?.errors;
      if (Array.isArray(responseErrors) && responseErrors.length > 0) {
        setServerErrors(responseErrors);
      } else {
        setServerErrors([{ message: err.response?.data?.message || 'Server error occurred during bulk upload.' }]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSelectedFile(null);
    setParseResult(null);
    setServerErrors([]);
    setUploadSummary(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-950 w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="text-brand-500" size={22} />
              Time Table Bulk Upload
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload class periods across multiple years & sections via Excel
            </p>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* 3-Step Visual Progress Bar */}
        <div className="px-6 py-3 bg-gray-50/30 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
              Select File
            </div>
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-700" />
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
              Preview & Validate
            </div>
            <ChevronRight size={14} className="text-gray-300 dark:text-gray-700" />
            <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 3 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3</span>
              Complete
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* Server-side Error Banner if any */}
          {serverErrors.length > 0 && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-2xl">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold text-sm mb-1.5">
                <AlertCircle size={18} />
                <span>Upload Rejected by Server ({serverErrors.length} issues)</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 text-xs text-red-600 dark:text-red-300">
                {serverErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Upload File */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                tabIndex={0}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 ${
                  isDragging
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 scale-[0.99]'
                    : 'border-gray-200 dark:border-gray-800 hover:border-brand-400 hover:bg-gray-50/80 dark:hover:bg-gray-900/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
                  {isParsing ? (
                    <RefreshCw size={32} className="animate-spin" />
                  ) : (
                    <UploadCloud size={32} />
                  )}
                </div>

                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                  {isParsing ? 'Parsing Spreadsheet...' : 'Drop your timetable file here'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                  Supports Excel (.xlsx, .xls) and CSV (.csv) files up to 10MB
                </p>

                <div className="mt-5">
                  <span className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20 hover:bg-brand-700 transition-colors inline-block">
                    Browse Computer
                  </span>
                </div>
              </div>

              {/* Template Download & Guide Bar */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white">Need the official template?</h5>
                    <p className="text-xs text-gray-500">Includes valid sections and faculty reference data.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                >
                  <Download size={14} /> Download Template
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Validation */}
          {step === 2 && parseResult && (
            <TimeTableUploadPreview
              parseResult={parseResult}
              onBack={() => setStep(1)}
              onConfirm={handleConfirmUpload}
              isSubmitting={isSubmitting}
            />
          )}

          {/* STEP 3: Completed Success View */}
          {step === 3 && (
            <div className="py-8 text-center space-y-5">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto animate-in zoom-in-75 duration-300">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">Timetable Uploaded Successfully!</h4>
                <p className="text-sm text-gray-500 mt-1">
                  All class periods have been validated, processed, and synced to the database.
                </p>
              </div>

              {uploadSummary && (
                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 max-w-md mx-auto text-left space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold border-b border-gray-200 dark:border-gray-800 pb-2">
                    <span className="text-gray-500">Total Periods Synced</span>
                    <span className="text-brand-600 dark:text-brand-400 font-bold text-sm">
                      {uploadSummary.totalPeriodsInserted} Periods
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-gray-500">Affected Sections:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {uploadSummary.yearsSectionsUpdated?.map((sec, i) => (
                        <span key={i} className="px-2.5 py-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-xs font-semibold rounded-lg">
                          ✓ {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-brand-500/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  View Time Table
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
