"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Designer } from "@pdfme/ui";
import { cloneDeep, createTemplate } from "./helper";
import styles from "@/styles/components/pdfEditor.module.scss";
import { toast } from "react-toastify";
import Draggable from "react-draggable";

// Simple Button component
const Button = ({ children, onClick, w, h, bgc, variant, ...props }) => {
  const getBackgroundColor = () => {
    if (bgc) return bgc;
    if (variant === "secondary") return "#6b7280";
    return "#2563eb";
  };

  return (
    <button 
      onClick={onClick} 
      className={styles.button}
      style={{ 
        padding: '8px 16px',
        backgroundColor: getBackgroundColor(),
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: w ? `${w}px` : 'auto',
        height: h ? `${h}px` : 'auto',
        ...props.style 
      }} 
      {...props}
    >
      {children}
    </button>
  );
};

function PDFEditorForExising({ file, onSavePdfTemplate, originalFileName }) {
  const designerRef = useRef(null);
  const designer = useRef(null);
  const templateRef = useRef(null); // Store template separately
  const [isDesignerReady, setIsDesignerReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
        template: templateCopy,
        options: {
          labels: {
            addNewField: "הוספת שדה חדש",
            clear: "🗑️ נקה",
          },
          theme: {
            token: {
              colorPrimary: "#25c2a0",
            },
          },
        }
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

  const buildDesigner = useCallback((_file) => {
    try {
      setIsLoading(true);
      console.log("Parsing template file...");
      
      // Parse the file which is already a JSON string
      let templateData;
      try {
        templateData = JSON.parse(_file);
      } catch (parseError) {
        throw new Error(`Failed to parse template JSON: ${parseError.message}`);
      }
      
      if (!templateData || !templateData.basePdf) {
        throw new Error("Invalid template format: Missing PDF data");
      }
      
      console.log("Template parsed successfully");
      
      // Create designer with the parsed template
      createDesigner(templateData);
    } catch (error) {
      console.error("Error in buildDesigner:", error);
      setErrorMessage(`שגיאה כללית: ${error.message}`);
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
      
      if (onSavePdfTemplate) {
        onSavePdfTemplate(blob);
      } else {
        toast.success("Template prepared for saving");
      }
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
      
      // Get current page index, or default to 0
      let pageIndex = 0;
      try {
        if (typeof designer.current.getPageCursor === 'function') {
          pageIndex = designer.current.getPageCursor();
        }
      } catch (e) {
        console.log("getPageCursor not available, using page 0");
      }
      
      // Initialize schema for current page if needed
      if (!newTemplate.schemas[pageIndex]) {
        newTemplate.schemas[pageIndex] = {};
      }
      
      // Generate unique field key if needed
      let finalFieldKey = fieldKey;
      const existingFields = Object.keys(newTemplate.schemas[pageIndex] || {});
      
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
        alignment: "right", // For RTL
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

  const loadRef = useCallback((r) => {
    if (r) {
      designerRef.current = r;
      setIsDesignerReady(true);
    }
  }, []);

  const fieldDictionary = [
    { label: "שם מלא", key: "worker_full_name" },
    { label: "שם פרטי", key: "worker_first_name" },
    { label: "שם משפחה", key: "worker_last_name" },
    { label: "מספר סידורי", key: "worker_serial_number" },
    { label: "מספר סידורי קודם", key: "worker_prev_serial_number" },
    { label: "מספר דרכון", key: "worker_passport" },
    { label: "תעודת זהות", key: "worker_id" },
    { label: "תאריך לידה", key: "worker_dob" },
    { label: "טלפון", key: "worker_phone" },
    { label: "תאריך נוכחי", key: "current_date" },
    { label: "מקצוע", key: "professionHebrew" },
    { label: "תאריך תחילת עבודה", key: "worker_start_date" },
    { label: "תאריך כניסה ראשוני לישראל", key: "firstIsraelEntryDate" },
    { label: "תאריך סיום העסקה", key: "contractTerminationDate" },
    { label: "תאריך בריחה", key: "escapeDate" },
    { label: "תאריך הודעת פיטורין", key: "dateOfDismissalNotice" },
    { label: "שם איש קשר בבית", key: "homeRelativeContactName" },
    { label: "מספר טלפון בבית", key: "homePhoneNumber" },
    { label: "מספר טלפון של איש קשר בבית", key: "homeRelativeContactPhoneNumber" },
    { label: "יחס של איש קשר בבית", key: "homeRelativeContactRelation" },
    { label: "כתובת איש קשר בבית", key: "homeRelativeContactAddress" },
    { label: "שם הבנק במדינת המוצא", key: "homeCountryBankName" },
    { label: "קוד הבנק במדינת המוצא", key: "homeCountryBankCode" },
    { label: "מספר סניף במדינת המוצא", key: "homeCountryBranchNumber" },
    { label: "מספר חשבון במדינת המוצא", key: "homeCountryBankAccountIBAN" },
    { label: "שם הבנק בישראל", key: "israelBankHebrewName" },
    { label: "סניף הבנק בישראל", key: "israelBankBranch" },
    { label: "מספר חשבון בישראל", key: "israelBankAccountNumber" },
    { label: "שם הבנק להפקדות", key: "depositBankHebrewName" },
    { label: "סניף הבנק להפקדות", key: "depositBankBranch" },
    { label: "מספר חשבון להפקדות", key: "depositBankAccountNumber" },
    { label: "שם חברה", key: "companyName" },
    { label: "שם חברה באנגלית", key: "companyEnglishName" },
    { label: "טלפון ראשי", key: "mainPhone" },
    { label: "טלפון משני", key: "secPhone" },
    { label: "אימייל", key: "email" },
    { label: "שם השולח באימייל", key: "emailSenderName" },
    { label: "כתובת השולח באימייל", key: "emailSenderAddress" },
    { label: "שם החותם", key: "signaturePerson" },
    { label: "שם החותם באנגלית", key: "signaturePersonEnglish" },
    { label: "תפקיד החותם", key: "signaturePersonTitle" },
    { label: "תפקיד החותם באנגלית", key: "signaturePersonTitleEnglish" },
    { label: "תעודת זהות של החותם", key: "signaturePersonId" },
    { label: "שם עורך הדין", key: "lawerName" },
    { label: "שם עורך הדין באנגלית", key: "lawerNameEnglish" },
    { label: "תעודת זהות של עורך הדין", key: "lawerGovId" },
    { label: "כתובת", key: "address" },
    { label: "כתובת באנגלית", key: "addressEnglish" },
    { label: "עיר", key: "city" },
    { label: "עיר באנגלית", key: "cityEnglish" },
    { label: "מספר חפ", key: "govId" },
    { label: "מספר תאגיד", key: "organizationNumber" },
    { label: "שם מדינה בעברית", key: "worker_country_hebrew" },
    { label: "שם מדינה באנגלית", key: "worker_country_english" },
    { label: "קוד מדינה (3 ספרות)", key: "worker_country_code" },
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
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>עריכת תבנית</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button w={200} h={40} onClick={onSave}>
            סיום והעלאת מסמך
          </Button>
          <Button
            w={300}
            bgc={"#006400"}
            h={40}
            onClick={() => setShowDictionary(!showDictionary)}
          >
            {showDictionary ? "הסתר מילון" : "הצג מילון השלמה אוטומטית"}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>טוען מסמך...</div>
        </div>
      )}

      <div style={{ height: "calc(100vh - 80px)", position: "relative" }}>
        <div
          className={styles.designerContainer}
          ref={loadRef}
          style={{ height: "100%" }}
        />

        {isMounted && showDictionary && (
          <Draggable handle=".drag-handle">
            <div className={styles.dictionary}>
              <div className="drag-handle">
                <div className={styles.dictionaryHeader}>
                  <h2>מילון שדות אוטומטיים</h2>
                  <div>
                    <span
                      onClick={() => setShowDictionary(false)}
                      className={styles.closeButton}
                    >
                      ✕
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.dictionaryContent}>
                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="חיפוש שדה..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                <p className={styles.dictionaryHelp}>
                  במידה ותרצו להשתמש במילוי בפרטים באופן אוטומטי במסמכי העובד יש
                  להזין את שם השדה לפי המילון
                  <br />
                  <span>
                    לצורך חזרה על שדה ניתן להגדיר את שם השדה עם ספרה בסופו. למשל
                    worker_first_name1, worker_first_name2 וכו
                  </span>
                </p>

                <ul className={styles.fieldList}>
                  {filteredDictionary.map(({ label, key }) => (
                    <li key={key} className={styles.fieldItem}>
                      <div className={styles.fieldInfo}>
                        <strong>{label}</strong>{" "}
                        <span className={styles.fieldKey}>{key}</span>
                      </div>
                      <button
                        onClick={() => handleAddField(key)}
                        className={styles.addFieldButton}
                      >
                        הוסף
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Draggable>
        )}
      </div>
    </div>
  );
}

export default PDFEditorForExising; 