"use client";

import React, { useEffect, useRef, useState } from "react";
import Spinner from "@/components/spinner";
import { getLanguageFromCountryCode, getTranslations } from "@/lib/utils/languageMappings";
import dayjs from "dayjs";

/**
 * A simplified fallback PDF component that provides basic PDF functionality
 */
const SimplePDFTemplateForm = ({
  template: originalTemplate,
  workerDetails,
  organizationSettings,
  onSubmit,
  countryCode = "376", // Default to Israel
}) => {
  // Core refs and state
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('fallback'); // 'fallback' or 'original'
  
  // Get translations
  const language = getLanguageFromCountryCode(countryCode);
  const translations = getTranslations(language);
  
  // Default translations fallback
  const defaultTranslations = {
    loading: "Loading...",
    error: "Error",
    generateDocument: "Generate Document",
    downloadOriginal: "Download Original Template",
    viewFallback: "View Fallback PDF",
    viewOriginal: "View Original Template"
  };
  
  // Ensure all required translations exist
  Object.keys(defaultTranslations).forEach(key => {
    if (!translations[key]) {
      translations[key] = defaultTranslations[key];
    }
  });

  // Get a blank PDF data URL
  const getBlankPdfDataUrl = () => {
    return "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G";
  };

  // Check if we have an original template URL we can use
  const getOriginalPdfUrl = () => {
    if (originalTemplate?.basePdf && 
        typeof originalTemplate.basePdf === 'string' && 
        !originalTemplate.basePdf.includes('.json')) {
      return originalTemplate.basePdf;
    }
    return null;
  };

  // Initialize the iframe with the appropriate PDF source
  useEffect(() => {
    if (!containerRef.current) return;
    updatePdfView();
  }, [viewMode]);

  // Update the PDF view based on the current view mode
  const updatePdfView = () => {
    if (!containerRef.current) return;
    
    // Create iframe for displaying PDF
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    // Set source based on view mode
    if (viewMode === 'original') {
      const originalUrl = getOriginalPdfUrl();
      if (originalUrl) {
        iframe.src = originalUrl;
      } else {
        iframe.src = getBlankPdfDataUrl();
      }
    } else {
      iframe.src = getBlankPdfDataUrl();
    }
    
    // Clear container and add new iframe
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(iframe);
  };

  // Toggle between original template and fallback PDF
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'fallback' ? 'original' : 'fallback');
  };

  // Generate document with worker data
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // For now, just convert the simple PDF to a blob
      const response = await fetch(getBlankPdfDataUrl());
      const blob = await response.blob();
      
      // Call the onSubmit callback with the blob
      if (onSubmit) {
        onSubmit(blob);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(`Failed to generate PDF: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Download the original template if available
  const handleDownloadOriginal = async () => {
    const originalUrl = getOriginalPdfUrl();
    if (!originalUrl) {
      setError("Original template URL is not available");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Fetch the original PDF
      const response = await fetch(originalUrl);
      const blob = await response.blob();
      
      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = originalTemplate.name || 'template.pdf';
      link.click();
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error downloading original template:", error);
      setError(`Failed to download original template: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Check if original PDF is available
  const hasOriginalPdf = !!getOriginalPdfUrl();

  return (
    <div className="pdf-template-form relative">
      {/* Error notice */}
      <div className="mb-2 p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-md">
        <p className="font-semibold text-lg">⚠️ Using Basic PDF Mode</p>
        <p className="mt-1">
          We're showing a simplified view because we couldn't initialize the PDF editor with your template.
        </p>
        <p className="mt-2 text-sm">Worker: <span className="font-medium">{workerDetails?.firstName || ''} {workerDetails?.lastName || ''}</span></p>
        <p className="text-sm">Date: <span className="font-medium">{dayjs().format('DD/MM/YYYY')}</span></p>
        {hasOriginalPdf && (
          <div className="mt-2">
            <button 
              onClick={toggleViewMode}
              className="text-sm bg-white hover:bg-gray-50 text-gray-800 font-medium py-1 px-2 border border-gray-300 rounded"
            >
              {viewMode === 'fallback' 
                ? translations.viewOriginal || 'View Original Template' 
                : translations.viewFallback || 'View Fallback PDF'}
            </button>
            <button 
              onClick={handleDownloadOriginal}
              className="ml-2 text-sm bg-white hover:bg-gray-50 text-gray-800 font-medium py-1 px-2 border border-gray-300 rounded"
            >
              {translations.downloadOriginal || 'Download Original Template'}
            </button>
          </div>
        )}
      </div>
      
      {/* PDF view selection status */}
      {hasOriginalPdf && (
        <div className="px-2 py-1 mb-1 text-xs font-medium">
          Currently viewing: {viewMode === 'original' ? 'Original Template' : 'Basic PDF'}
        </div>
      )}
      
      {/* Container for PDF iframe */}
      <div 
        ref={containerRef} 
        id="pdf-form-container"
        className="pdf-form-container border border-gray-300 rounded" 
        style={{ 
          minHeight: "700px", 
          height: "700px",
          width: "100%",
          background: "#f8f9fa"
        }}
      ></div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <Spinner />
          <span className="ml-2 text-gray-700">{translations.loading}</span>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          <p className="font-semibold">{translations.error}</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          {translations.generateDocument}
        </button>
      </div>
    </div>
  );
};

export default SimplePDFTemplateForm; 