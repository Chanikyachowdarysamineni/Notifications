import React, { useState, useEffect, useMemo } from 'react';
import axios from '../lib/axios';

const TargetAudienceSelector = ({ targetAll, targetYears, targetSections, onChange }) => {
  const [years, setYears] = useState([]);
  const [sectionsByYear, setSectionsByYear] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState({});

  useEffect(() => {
    const fetchAudienceData = async () => {
      try {
        const yearsRes = await axios.get('/api/years');
        const fetchedYears = yearsRes.data;
        setYears(fetchedYears);

        // Fetch sections for all years
        const sectionsData = {};
        await Promise.all(
          fetchedYears.map(async (year) => {
            const secRes = await axios.get(`/api/sections?year=${year._id}`);
            sectionsData[year._id] = secRes.data;
          })
        );
        setSectionsByYear(sectionsData);
      } catch (error) {
        console.error('Error fetching audience data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAudienceData();
  }, []);

  // Derived state helpers
  const totalAvailableSections = useMemo(() => {
    return Object.values(sectionsByYear).flat().length;
  }, [sectionsByYear]);

  // Is everything selected?
  // We consider "all selected" if `targetAll` is true OR if every single section is selected.
  // The spec says if everything is selected we should submit target_all: true.
  const isAllSelected = useMemo(() => {
    if (targetAll) return true;
    if (totalAvailableSections === 0) return false;
    return targetSections.length === totalAvailableSections;
  }, [targetAll, targetSections.length, totalAvailableSections]);

  const isIndeterminateAll = useMemo(() => {
    if (targetAll) return false;
    return targetSections.length > 0 && targetSections.length < totalAvailableSections;
  }, [targetAll, targetSections.length, totalAvailableSections]);

  // Handle global "Select All"
  const handleSelectAllChange = () => {
    if (isAllSelected) {
      // Uncheck all
      onChange({ target_all: false, target_year: [], target_section: [] });
    } else {
      // Check all
      onChange({ target_all: true, target_year: [], target_section: [] });
    }
  };

  // Handle checking a specific Year (selects/unselects all its sections)
  const handleYearChange = (yearId) => {
    const sectionsForThisYear = sectionsByYear[yearId] || [];
    const sectionIdsForThisYear = sectionsForThisYear.map(s => s._id);
    
    // Check if this year is fully selected
    const isYearFullySelected = sectionIdsForThisYear.every(id => targetSections.includes(id));
    
    let newSelectedSections;
    if (isYearFullySelected) {
      // Unselect all sections for this year
      newSelectedSections = targetSections.filter(id => !sectionIdsForThisYear.includes(id));
    } else {
      // Select all sections for this year
      newSelectedSections = [...new Set([...targetSections, ...sectionIdsForThisYear])];
    }

    // After updating sections, determine the required years
    updateSelectionFromSections(newSelectedSections);
  };

  // Handle checking a specific Section
  const handleSectionChange = (sectionId) => {
    let newSelectedSections;
    if (targetSections.includes(sectionId)) {
      newSelectedSections = targetSections.filter(id => id !== sectionId);
    } else {
      newSelectedSections = [...targetSections, sectionId];
    }
    
    updateSelectionFromSections(newSelectedSections);
  };

  // Helper to re-evaluate the whole selection payload from a list of section IDs
  const updateSelectionFromSections = (newSelectedSections) => {
    if (newSelectedSections.length === totalAvailableSections && totalAvailableSections > 0) {
      // Everything is selected
      onChange({ target_all: true, target_year: [], target_section: [] });
      return;
    }

    // Determine which years have AT LEAST ONE section selected
    const newSelectedYears = [];
    years.forEach(year => {
      const yearSectionIds = (sectionsByYear[year._id] || []).map(s => s._id);
      const hasAnySelected = yearSectionIds.some(id => newSelectedSections.includes(id));
      if (hasAnySelected) {
        newSelectedYears.push(year._id);
      }
    });

    onChange({ target_all: false, target_year: newSelectedYears, target_section: newSelectedSections });
  };

  const toggleYearExpanded = (yearId) => {
    setExpandedYears(prev => ({ ...prev, [yearId]: !prev[yearId] }));
  };

  // Generate plain language summary
  const summaryText = useMemo(() => {
    if (targetAll || (targetSections.length === 0 && !targetAll)) {
      return 'Visible to: Everyone';
    }
    
    const parts = [];
    years.forEach(year => {
      const yearSectionIds = (sectionsByYear[year._id] || []).map(s => s._id);
      const selectedForYear = yearSectionIds.filter(id => targetSections.includes(id));
      
      if (selectedForYear.length === 0) return;
      
      if (selectedForYear.length === yearSectionIds.length) {
        parts.push(`${year.name} (all sections)`);
      } else {
        const sectionNames = sectionsByYear[year._id]
          .filter(s => targetSections.includes(s._id))
          .map(s => s.name);
        parts.push(`${year.name} - ${sectionNames.join(', ')}`);
      }
    });
    
    return `Visible to: ${parts.join('; ')}`;
  }, [targetAll, targetSections, years, sectionsByYear]);

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-2">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
        No years/sections configured yet. Set these up under Section & Year Management before targeting content.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
          {summaryText}
        </span>
        <button 
          type="button" 
          onClick={() => onChange({ target_all: true, target_year: [], target_section: [] })}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Reset Selection
        </button>
      </div>

      <div className="p-0">
        {/* Global Select All Row */}
        <label className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors">
          <input 
            type="checkbox"
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            checked={isAllSelected}
            ref={input => {
              if (input) input.indeterminate = isIndeterminateAll;
            }}
            onChange={handleSelectAllChange}
          />
          <span className="ml-3 font-semibold text-gray-900">Select All Years & Sections</span>
        </label>

        {/* Per-Year Rows */}
        <div className="divide-y divide-gray-100">
          {years.map(year => {
            const yearSections = sectionsByYear[year._id] || [];
            const yearSectionIds = yearSections.map(s => s._id);
            const selectedCount = yearSectionIds.filter(id => targetSections.includes(id)).length;
            const isYearAll = selectedCount === yearSectionIds.length && yearSectionIds.length > 0;
            const isYearIndeterminate = selectedCount > 0 && selectedCount < yearSectionIds.length;
            
            // If targetAll is true, visually everything is selected
            const displayChecked = targetAll ? true : isYearAll;
            const displayIndeterminate = targetAll ? false : isYearIndeterminate;

            return (
              <div key={year._id} className="flex flex-col">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                  <label className="flex items-center flex-1 cursor-pointer min-h-[44px]">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={displayChecked}
                      ref={input => {
                        if (input) input.indeterminate = displayIndeterminate;
                      }}
                      onChange={() => handleYearChange(year._id)}
                    />
                    <span className="ml-3 font-medium text-gray-800">
                      {year.name} 
                      <span className="text-gray-400 font-normal ml-2 text-sm">
                        ({targetAll ? yearSections.length : selectedCount} of {yearSections.length} sections)
                      </span>
                    </span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => toggleYearExpanded(year._id)}
                    className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label="Toggle sections"
                  >
                    <svg className={`w-5 h-5 transform transition-transform ${expandedYears[year._id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Sections for this Year */}
                {expandedYears[year._id] && (
                  <div className="bg-gray-50 pl-12 pr-4 py-2 flex flex-col gap-1 border-t border-gray-100">
                    {yearSections.length === 0 ? (
                      <span className="text-sm text-gray-500 py-2">No sections exist for this year.</span>
                    ) : (
                      yearSections.map(section => (
                        <label key={section._id} className="flex items-center py-2 cursor-pointer min-h-[44px] hover:bg-gray-100 rounded px-2 -ml-2 transition-colors">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={targetAll ? true : targetSections.includes(section._id)}
                            onChange={() => handleSectionChange(section._id)}
                          />
                          <span className="ml-3 text-sm text-gray-700">{section.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Leave everything unchecked to explicitly send to all years and sections.
      </div>
    </div>
  );
};

export default TargetAudienceSelector;
