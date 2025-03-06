"use client";

import React, { useRef, useState, useEffect } from "react";
import { Viewer } from "@pdfme/ui";
import { cloneDeep } from "./helper";
import styles from "@/styles/components/pdfEditor.module.scss";
import { toast } from "react-toastify";

// Simple Button component
const Button = ({ children, onClick, ...props }) => {
  return (
    <button 
      onClick={onClick} 
      className={styles.button}
      style={{ 
        padding: '8px 16px',
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...props.style 
      }} 
      {...props}
    >
      {children}
    </button>
  );
};

function PDFTemplateViewer({ template, hideAllButtons = false }) {
  const viewerRef = useRef(null);
  const viewer = useRef(null);
  const templateRef = useRef(null); // Store template separately
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to redirect to settings
  const redirectToSettings = () => {
    window.location.href = "/admin/settings?tab=documents";
  };

  // Debug function to inspect viewer and template
  const inspectTemplate = (template) => {
    if (!template) return;
    
    console.log("Template structure:", {
      hasBasePdf: !!template.basePdf,
      schemasLength: template.schemas?.length || 0,
      columnsLength: template.columns?.length || 0,
      hasSampleData: !!template.sampledata
    });
  };

  // Create or recreate the viewer with a given template
  const createViewer = (template) => {
    try {
      setIsLoading(true);
      console.log("Creating Viewer instance...");
      
      // Destroy existing viewer if any
      if (viewer.current) {
        try {
          console.log("Destroying existing viewer");
          viewer.current.destroy();
          viewer.current = null;
        } catch (destroyError) {
          console.error("Error destroying viewer:", destroyError);
        }
      }
      
      // Check if we have a valid DOM container
      if (!viewerRef.current) {
        throw new Error("Viewer container not found");
      }
      
      // Deep clone template to avoid reference issues
      const templateCopy = cloneDeep(template);
      
      // Store in ref for later use
      templateRef.current = templateCopy;
      
      // Ensure template has necessary structure
      if (!templateCopy.basePdf) {
        console.warn("Template is missing basePdf");
      }
      
      if (!templateCopy.schemas || !templateCopy.schemas.length) {
        console.warn("Template has no schemas");
      }
      
      // Generate sample data if not provided
      const sampleData = templateCopy.sampledata || 
        (templateCopy.columns?.length ? [generateSampleData(templateCopy.columns)] : [{}]);
      
      console.log("Creating viewer with template and sample data");
      inspectTemplate(templateCopy);
      
      // Create new viewer with minimal options
      viewer.current = new Viewer({
        domContainer: viewerRef.current,
        template: templateCopy,
        inputs: sampleData,
      });
      
      console.log("Viewer created successfully");
      setIsLoading(false);
      
      return true;
    } catch (error) {
      console.error("Error creating viewer:", error);
      setErrorMessage(`שגיאה ביצירת העורך: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  };

  // Helper function to generate sample data for the template
  const generateSampleData = (columns) => {
    if (!columns || !columns.length) return {};
    
    const sampleData = {};
    columns.forEach(column => {
      sampleData[column] = `דוגמה ל${column}`;
    });
    
    return sampleData;
  };

  // Initialize the viewer when template is available
  useEffect(() => {
    if (isViewerReady && template) {
      try {
        console.log("Initializing viewer with template");
        createViewer(template);
      } catch (error) {
        console.error("Error initializing viewer:", error);
        setErrorMessage(`שגיאה באתחול התצוגה: ${error.message}`);
      }
    }
  }, [isViewerReady, template]);

  // Set up the viewer container reference
  const loadRef = React.useCallback((r) => {
    if (r) {
      viewerRef.current = r;
      setIsViewerReady(true);
    }
  }, []);

  // Clean up when component is unmounted
  useEffect(() => {
    return () => {
      if (viewer.current) {
        try {
          viewer.current.destroy();
        } catch (error) {
          console.error("Error destroying viewer:", error);
        }
      }
    };
  }, []);

  // Render error message if there's an error
  if (errorMessage) {
    return (
      <div className={styles.errorContainer}>
        <h3 className={styles.errorTitle}>שגיאה</h3>
        <p className={styles.errorMessage}>{errorMessage}</p>
        {!hideAllButtons && (
          <Button
            onClick={redirectToSettings}
          >
            {"<"} חזרה
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {!hideAllButtons && (
        <div className={styles.header}>
          <Button
            onClick={redirectToSettings}
          >
            {"<"} חזרה
          </Button>
        </div>
      )}

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>טוען תבנית...</div>
        </div>
      )}

      <div className={styles.viewer}>
        <div
          ref={loadRef}
          style={{ width: "100%", height: "calc(100vh - 100px)" }}
        />
      </div>
    </div>
  );
}

export default PDFTemplateViewer; 