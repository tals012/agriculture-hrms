"use client";

import React, { useRef, useState, useEffect } from "react";
import { Designer } from "@pdfme/ui";
import { readFile, cloneDeep, createTemplate } from "./helper";
import styles from "@/styles/components/pdfEditor.module.scss";
import { toast } from "react-toastify";
import dynamic from 'next/dynamic';

// Import DictionaryContainer with no SSR
const DictionaryContainer = dynamic(() => import('./DictionaryContainer'), { 
  ssr: false 
});

function PDFEditor({ file, onSavePdfTemplate, onChangeBasePDF }) {
  const designerRef = useRef(null);
  const designer = useRef(null);
  const templateRef = useRef(null); // Store template separately
  const [showDictionary, setShowDictionary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDesignerReady, setIsDesignerReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true after the component mounts
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Debug function to inspect designer instance
  const inspectDesigner = (designerInstance) => {
    if (!designerInstance) return;
    
    console.log('Designer methods available:', Object.getOwnPropertyNames(
      Object.getPrototypeOf(designerInstance)
    ));

    try {
      console.log('Current template structure:', 
        JSON.stringify(designerInstance.getTemplate(), null, 2).substring(0, 500) + '...'
      );
    } catch (e) {
      console.error('Error getting template:', e);
    }
  };

  // Create or recreate the designer with a given template
  const createDesigner = (template) => {
    try {
      setIsLoading(true);
      console.log("Creating new Designer instance...");
      
      // Destroy existing designer if any
      if (designer.current) {
        try {
          console.log("Destroying existing designer");
          designer.current.destroy();
          designer.current = null;
        } catch (destroyError) {
          console.error("Error destroying designer:", destroyError);
        }
      }
      
      // Check if we have a valid DOM container
      if (!designerRef.current) {
        throw new Error("Designer container not found");
      }
      
      // Deep clone template to avoid reference issues
      const templateCopy = cloneDeep(template);
      
      // Store in ref for later use
      templateRef.current = templateCopy;
      
      console.log("Creating new designer with template");
      
      // Create new designer
      designer.current = new Designer({
        domContainer: designerRef.current,
        template: templateCopy
      });
      
      console.log("Designer created successfully");
      inspectDesigner(designer.current);
      setIsLoading(false);
      
      return true;
    } catch (error) {
      console.error("Error creating designer:", error);
      setErrorMessage(`שגיאה ביצירת העורך: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  };

  const buildDesigner = React.useCallback((_file) => {
    try {
      setIsLoading(true);
      console.log("Loading PDF file:", _file?.name);
      
      readFile(_file, "dataURL").then(async (basePdf) => {
        try {
          if (!basePdf) {
            throw new Error("Failed to read PDF data");
          }
          
          console.log("PDF loaded successfully as dataURL");
          
          // Create initial template
          const template = createTemplate(basePdf);
          
          // Create designer with this template
          createDesigner(template);
        } catch (error) {
          console.error("Error processing PDF:", error);
          setErrorMessage(`שגיאה בעיבוד ה-PDF: ${error.message}`);
          setIsLoading(false);
        }
      }).catch(error => {
        console.error("Error reading file:", error);
        setErrorMessage(`שגיאה בקריאת הקובץ: ${error.message}`);
        setIsLoading(false);
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      setErrorMessage(`שגיאה לא צפויה: ${error.message}`);
      setIsLoading(false);
    }
  }, []);

  const onSave = async () => {
    if (!designer.current) {
      toast.error("העורך אינו זמין, לא ניתן לשמור תבנית");
      return;
    }
    
    try {
      const templateData = designer.current.getTemplate();
      console.log("Saving template");
      
      const blob = new Blob([JSON.stringify(templateData)], {
        type: "application/json",
      });
      console.log("---------- blob ---------", blob);
      onSavePdfTemplate(blob);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error(`שגיאה בשמירת התבנית: ${error.message}`);
    }
  };

  const handleAddField = (fieldKey) => {
    try {
      console.log(`Adding field: ${fieldKey}`);
      
      // Get current template from ref or from designer
      let currentTemplate;
      if (templateRef.current) {
        currentTemplate = templateRef.current;
        console.log("Using template from ref");
      } else if (designer.current) {
        currentTemplate = designer.current.getTemplate();
        console.log("Using template from designer");
      } else {
        toast.error("העורך אינו זמין, לא ניתן להוסיף שדה");
        return;
      }
      
      console.log("Template basePdf exists:", !!currentTemplate.basePdf);
      
      // Create a new template by deep cloning
      const newTemplate = cloneDeep(currentTemplate);
      
      // Always use page 0 (first page)
      const pageIndex = 0;
      
      // Initialize schema for first page if needed
      if (!newTemplate.schemas[pageIndex]) {
        newTemplate.schemas[pageIndex] = {};
      }
      
      // Generate unique field key if needed
      let finalFieldKey = fieldKey;
      const existingFields = Object.keys(newTemplate.schemas[pageIndex]);
      
      if (existingFields.includes(fieldKey)) {
        let counter = 1;
        while (existingFields.includes(`${fieldKey}${counter}`)) {
          counter++;
        }
        finalFieldKey = `${fieldKey}${counter}`;
      }
      
      // Position field smartly
      const fieldCount = existingFields.length;
      const xPosition = 50;
      const yPosition = 50 + (fieldCount * 25);
      
      // Add the field to the schema
      newTemplate.schemas[pageIndex][finalFieldKey] = {
        type: "text",
        position: { x: xPosition, y: yPosition },
        width: 150,
        height: 15,
        fontSize: 12,
        alignment: "right",
      };
      
      // Update columns
      if (!newTemplate.columns) {
        newTemplate.columns = [];
      }
      
      if (!newTemplate.columns.includes(finalFieldKey)) {
        newTemplate.columns.push(finalFieldKey);
      }
      
      // IMPORTANT: Store the new template in our ref
      templateRef.current = newTemplate;
      
      // Recreate the designer with the new template
      const success = createDesigner(newTemplate);
      
      if (success) {
        toast.success(`השדה "${finalFieldKey}" נוסף בהצלחה`);
      } else {
        toast.error("שגיאה בהוספת השדה");
      }
    } catch (error) {
      console.error("Error adding field:", error);
      toast.error(`שגיאה בהוספת השדה: ${error.message}`);
    }
  };

  useEffect(() => {
    if (isDesignerReady && file) {
      buildDesigner(file);
    }

    return () => {
      if (designer.current) {
        try {
          designer.current.destroy();
        } catch (error) {
          console.error("Error destroying designer:", error);
        }
      }
    };
  }, [isDesignerReady, file, buildDesigner]);

  const loadRef = React.useCallback((r) => {
    if (r) {
      designerRef.current = r;
      setIsDesignerReady(true);
    }
  }, []);

  const fieldDictionary = [
    { label: "שם מלא", key: "worker_full_name" },
    { label: "שם פרטי", key: "worker_first_name" },
    { label: "שם משפחה", key: "worker_last_name" },
    { label: "מספר דרכון", key: "worker_passport" },
    { label: "תעודת זהות", key: "worker_id" },
    { label: "תאריך לידה", key: "worker_dob" },
    { label: "טלפון", key: "worker_phone" },
    { label: "תאריך נוכחי", key: "current_date" }
  ];

  const filteredDictionary = searchQuery
    ? fieldDictionary.filter(
        (field) =>
          field.label.includes(searchQuery) || field.key.includes(searchQuery)
      )
    : fieldDictionary;

  if (errorMessage) {
    return (
      <div className={styles.errorContainer}>
        <h3 className={styles.errorTitle}>שגיאה</h3>
        <p className={styles.errorMessage}>{errorMessage}</p>
        <button className={styles.button} onClick={onChangeBasePDF}>
          בחירת מסמך אחר
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>עריכת תבנית</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className={styles.button}
            onClick={() => setShowDictionary(!showDictionary)}
          >
            {showDictionary ? "הסתר מילון" : "הצג מילון"}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>טוען מסמך...</div>
        </div>
      )}

      <div style={{ height: "calc(100% - 150px)", position: "relative" }}>
        <div
          className={styles.designerContainer}
          ref={loadRef}
          style={{ height: "100%" }}
        />

        {/* Use the Portal-based DictionaryContainer instead */}
        {isMounted && showDictionary && (
          <DictionaryContainer
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredDictionary={filteredDictionary}
            handleAddField={handleAddField}
            onClose={() => setShowDictionary(false)}
          />
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.button} onClick={onSave}>
          שמירה
        </button>
        <button
          className={`${styles.button} ${styles.secondary}`}
          onClick={onChangeBasePDF}
        >
          שינוי מסמך בסיס
        </button>
      </div>
    </div>
  );
}

export default PDFEditor; 