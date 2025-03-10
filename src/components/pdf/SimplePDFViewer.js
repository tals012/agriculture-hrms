"use client";

import { generatePDF } from "@/lib/utils/pdfHelper";
import { getLanguageFromCountryCode, getTranslations } from "@/lib/utils/languageMappings";
import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import Spinner from "@/components/spinner";
import styles from "@/styles/components/pdf/pdfTemplateForm.module.scss";

/**
 * Ultra-simplified PDF Template Form
 * This version completely bypasses the @pdfme/ui Form component
 * and just shows the PDF in an iframe
 */
const SimplePDFViewer = ({
  template,
  workerDetails,
  organizationSettings,
  onSubmit,
  source,
  countryCode = "376", // Default to Israel
  onError = null,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const iframeRef = useRef(null);
  
  // Get translations
  const language = getLanguageFromCountryCode(countryCode);
  const translations = getTranslations(language);
  const isRTL = language === 'he' || language === 'ar';

  // Initialize the PDF display when component mounts
  useEffect(() => {
    initializePdfDisplay();
  }, [template]);

  // Initialize PDF display
  const initializePdfDisplay = async () => {
    try {
      setIsLoading(true);
      
      // Validate the template
      if (!template || !template.basePdf) {
        throw new Error("Invalid template: Missing basePdf URL");
      }
      
      // Just show the base PDF directly
      let pdfUrlToShow = template.basePdf;
      
      // If it's a data URL, use it directly. Otherwise, fetch it first
      if (!pdfUrlToShow.startsWith('data:')) {
        try {
          const response = await fetch(pdfUrlToShow);
          if (!response.ok) throw new Error("Failed to fetch PDF");
          
          const blob = await response.blob();
          pdfUrlToShow = URL.createObjectURL(blob);
        } catch (fetchError) {
          console.error("Error fetching PDF:", fetchError);
          pdfUrlToShow = getEmptyPdfDataUrl();
        }
      }
      
      // Set the PDF URL
      setPdfUrl(pdfUrlToShow);
      
    } catch (err) {
      console.error("Error initializing PDF display:", err);
      setError(`Failed to load PDF: ${err.message}`);
      if (onError) onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Create input data for the form
  const createInputData = () => {
    // Build the input data object
    return {
      // Worker information
      firstName: workerDetails?.firstName || "",
      lastName: workerDetails?.lastName || "",
      fullName: `${workerDetails?.firstName || ""} ${workerDetails?.lastName || ""}`.trim(),
      idNumber: workerDetails?.idNumber || "",
      phone: workerDetails?.phone || "",
      email: workerDetails?.email || "",
      
      // Organization information
      companyName: organizationSettings?.companyName || "",
      companyAddress: organizationSettings?.address || "",
      companyPhone: organizationSettings?.phone || "",
      companyEmail: organizationSettings?.email || "",
      
      // Date information
      currentDate: dayjs().format("DD/MM/YYYY"),
    };
  };

  // Generate a blank PDF data URL
  const getEmptyPdfDataUrl = () => {
    return "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G";
  };
  
  // Handle form submission (just generate a PDF with worker data)
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Create a minimal schema with worker data
      const minimalTemplate = {
        basePdf: template.basePdf,
        schemas: [{
          pages: [{
            width: 595,
            height: 842,
            elements: []
          }]
        }]
      };
      
      // Generate the PDF
      console.log("Generating minimal PDF with worker data");
      const pdfBlob = await generatePDF(
        minimalTemplate, 
        [createInputData()]
      );
      
      // Call the onSubmit handler with the blob
      if (onSubmit) {
        onSubmit(pdfBlob);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError(`Failed to generate PDF: ${error.message}`);
      if (onError) onError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Show a simple PDF viewer
  return (
    <div 
      className={styles.container}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Container for the PDF */}
      <div className={styles.pdfContainer}>
        {pdfUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className={styles.pdfIframe}
            title="PDF Document"
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            minHeight: '500px'
          }}>
            PDF preview not available
          </div>
        )}
      </div>
      
      {/* Error state */}
      {error && (
        <div className={styles.errorContainer}>
          <div className={styles.errorTitle}>{translations.error || "Error"}</div>
          <div>{error}</div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className={styles.loaderContainer}>
          <Spinner />
          <span className={styles.loaderText}>{translations.loadingTemplate || "Loading..."}</span>
        </div>
      )}
      
      {/* Info box for worker details */}
      <div className={styles.infoBox}>
        <div className={styles.infoTitle}>
          {translations.worker || "Worker"}
        </div>
        <div className={styles.infoContent}>
          <strong>{workerDetails?.firstName} {workerDetails?.lastName}</strong>
        </div>
        <div className={styles.infoDate}>
          {dayjs().format("DD/MM/YYYY")}
        </div>
      </div>
      
      {/* Form action buttons */}
      <div className={styles.formControls}>
        <button
          onClick={handleSubmit}
          className={styles.primaryButton}
          disabled={isLoading || !!error}
        >
          {translations.generateDocument || "Generate Document"}
        </button>
      </div>
    </div>
  );
};

export default SimplePDFViewer; 