// components/CourseModules.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface Topic {
  text?: string;
}

interface ModuleType {
  title?: string;
  topics?: Topic[];
}

interface CourseModulesProps {
  modules?: ModuleType[];
  accentColor?: string;
}

export default function CourseModules({
  modules = [],
  accentColor = "#6366f1",
}: CourseModulesProps) {
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({});
  const [expandedAll, setExpandedAll] = useState(false);

  // Initialize open state (closed by default)
  useEffect(() => {
    const initialState: Record<number, boolean> = {};
    modules.forEach((_, index: number) => {
      initialState[index] = false;
    });
    setOpenModules(initialState);
  }, [modules]);

  // Handle expand/collapse all
  useEffect(() => {
    const newState: Record<number, boolean> = {};
    modules.forEach((_, index: number) => {
      newState[index] = expandedAll;
    });
    setOpenModules(newState);
  }, [expandedAll, modules]);

  // Deep-link handling: if URL has #module-X, open that module
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    function openFromHash(): void {
      const hash = window.location.hash;
      if (!hash) return;
      
      const match = hash.match(/^#module-(\d+)$/);
      if (match) {
        const moduleIndex = Number(match[1]);
        setOpenModules((prevState) => ({ ...prevState, [moduleIndex]: true }));
        
        // Scroll into view for the module
        setTimeout(() => {
          const element = document.getElementById(`module-${moduleIndex}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    }
    
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  const hasOpenModules = useMemo(() => 
    Object.values(openModules).some(Boolean), 
    [openModules]
  );

  function toggleModule(index: number): void {
    setOpenModules((prevState) => ({
      ...prevState,
      [index]: !prevState[index]
    }));
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">📚</span>
        </div>
        <p className="text-gray-500">No course modules available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Course Content</h3>
          <p className="text-sm text-gray-600 mt-1">
            {modules.length} modules • {modules.reduce((total, module) => total + (module.topics?.length || 0), 0)} topics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpandedAll(prev => !prev)}
            className="px-4 py-2 text-sm font-medium border-2 rounded-lg transition-all duration-200 hover:shadow-md"
            style={{ 
              borderColor: accentColor, 
              color: accentColor,
              backgroundColor: expandedAll ? `${accentColor}15` : 'transparent'
            }}
          >
            {expandedAll ? "Collapse All" : "Expand All"}
          </button>
          
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: hasOpenModules ? accentColor : '#d1d5db' }}
            />
            <span>{hasOpenModules ? "Some modules open" : "All modules closed"}</span>
          </div>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-3 sm:space-y-4">
        {modules.map((module: ModuleType, index: number) => {
          const isOpen = Boolean(openModules[index]);
          const topicCount = module.topics?.length || 0;
          
          return (
            <div 
              key={index} 
              id={`module-${index}`} 
              className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Module Header */}
              <button
                onClick={() => toggleModule(index)}
                className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors duration-200"
                aria-expanded={isOpen}
                aria-controls={`module-content-${index}`}
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Module Number */}
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    {index + 1}
                  </div>
                  
                  {/* Module Info */}
                  <div className="min-w-0 flex-1">
                    <h4 
                      className="text-base sm:text-lg font-semibold mb-1 truncate sm:whitespace-normal"
                      style={{ color: accentColor }}
                    >
                      {module.title || `Module ${index + 1}`}
                    </h4>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500">
                      <span>{topicCount} topic{topicCount !== 1 ? 's' : ''}</span>
                      {topicCount > 0 && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate">
                            {isOpen ? 'Click to collapse' : 'Click to expand'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className="ml-4 flex-shrink-0">
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none"
                    className="transition-transform duration-200"
                    style={{ 
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      color: accentColor 
                    }}
                  >
                    <path 
                      d="M6 9l6 6 6-6" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  </svg>
                </div>
              </button>

              {/* Module Content */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                    id={`module-content-${index}`}
                  >
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                      <div className="border-t border-gray-100 pt-4">
                        {topicCount > 0 ? (
                          <div className="space-y-3">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">
                              Topics covered:
                            </h5>
                            <ol className="space-y-2 sm:space-y-3">
                              {module.topics?.map((topic: Topic, topicIndex: number) => (
                                <li 
                                  key={topicIndex} 
                                  className="flex items-start gap-3 group"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    {/* Topic Number */}
                                    <div 
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                                      style={{ backgroundColor: `${accentColor}cc` }}
                                    >
                                      {topicIndex + 1}
                                    </div>
                                    
                                    {/* Topic Text */}
                                    <span className="text-sm sm:text-base text-gray-700 leading-relaxed">
                                      {topic.text || `Topic ${topicIndex + 1}`}
                                    </span>
                                  </div>

                                  {/* Progress Indicator (placeholder) */}
                                  <div className="hidden sm:flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-400 text-lg">📄</span>
                            </div>
                            <p className="text-sm text-gray-500">
                              No topics available for this module yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Course content is subject to updates and improvements.</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Progress tracking coming soon</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}