"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import PDFTemplateViewer from "@/components/pdf/pdfTemplateViewer";
import styles from "@/styles/containers/settings/viewTemplate.module.scss";

function TemplateViewer({ link }) {
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch template from remote URL
  const loadRemoteFile = useCallback(async (_link) => {
    if (!_link) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching template from:", _link);
      
      const res = await fetch(_link);

      if (res.ok) {
        const templateData = await res.json();
        console.log("Template loaded successfully");
        
        // Validate template
        if (!templateData || !templateData.basePdf) {
          throw new Error("Invalid template format: Missing PDF data");
        }
        
        setTemplate(templateData);
      } else {
        const errorText = `Failed to load template: ${res.status} ${res.statusText}`;
        console.error(errorText);
        setError(errorText);
        toast.error("Failed to load the template file.", {
          position: "top-center",
        });
      }
    } catch (e) {
      console.error("Error loading template:", e);
      setError(e.message);
      toast.error(`Failed to load the template: ${e.message}`, {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load template when link changes
  useEffect(() => {
    if (link) loadRemoteFile(link);
  }, [link, loadRemoteFile]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading template...</p>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Template</h3>
        <p>{error}</p>
        <button 
          className={styles.retryButton} 
          onClick={() => loadRemoteFile(link)}
        >
          Retry
        </button>
      </div>
    );
  }

  // Show template viewer when template is loaded
  return (
    <div className={styles.container}>
      {template && <PDFTemplateViewer template={template} />}
    </div>
  );
}

export default TemplateViewer; 