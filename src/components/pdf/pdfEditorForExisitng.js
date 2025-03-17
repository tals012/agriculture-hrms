"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Designer } from "@pdfme/ui";
import { cloneDeep, createTemplate, getPlugins } from "./helper";
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
  
  // Ref for draggable dictionary
  const dictionaryNodeRef = useRef(null);

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
      
      // Fix existing signature fields in the template if they're still type "text"
      if (templateCopy && templateCopy.schemas) {
        let fixedFields = 0;
        templateCopy.schemas.forEach(schema => {
          if (!schema) return;
          
          Object.keys(schema).forEach(key => {
            // Check if field should be a signature field by name
            const isSignatureByName = 
              key.toLowerCase().includes('signature') || 
              key.toLowerCase() === 'sign' ||
              key.toLowerCase().includes('_sign');
              
            // If it has a signature name but is text type, transform it
            if (isSignatureByName && schema[key].type === 'text') {
              console.log(`Fixing field "${key}" from text to signature type`);
              
              // Save the original position
              const originalPosition = schema[key].position;
              
              // Replace with a signature field
              schema[key] = {
                type: "signature",
                position: originalPosition,
                width: schema[key].width < 50 ? 170 : schema[key].width,
                height: schema[key].height < 20 ? 40 : schema[key].height,
                rotate: 0,
                opacity: 1,
              };
              
              fixedFields++;
            }
          });
        });
        
        if (fixedFields > 0) {
          console.log(`Fixed ${fixedFields} signature fields in template`);
        }
      }
      
      // Get plugins including our custom signature plugin
      const plugins = getPlugins();
      console.log("Using plugins:", Object.keys(plugins));
      
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
          pdfZoom: {
            default: 1, // Default zoom level
            enableFitContent: true
          },
          // Ensure pages are centered
          pageContainer: {
            alignCenter: true,
            direction: "ltr" // Force LTR direction for the PDF
          },
          // Override any RTL settings
          direction: "ltr"
        },
        plugins: plugins
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
      
      // Determine if this is a signature field based on the field name
      const isSignatureField = 
        finalFieldKey.toLowerCase().includes('signature') || 
        finalFieldKey.toLowerCase() === 'sign' ||
        finalFieldKey.toLowerCase().includes('_sign');
      
      console.log(`Adding field: ${finalFieldKey}, detected as ${isSignatureField ? 'signature' : 'text'} type`);
      
      // Position field smartly
      const fieldCount = existingFields.length;
      const xPosition = 50;
      const yPosition = 50 + (fieldCount * 25);
      
      // Add the field to the schema with the correct type
      if (isSignatureField) {
        // For signature fields, create with signature type and appropriate dimensions
        newTemplate.schemas[pageIndex][finalFieldKey] = {
          type: "signature",
          position: { x: xPosition, y: yPosition },
          width: 170,
          height: 40,
          rotate: 0,
          opacity: 1,
        };
      } else {
        // For regular text fields, use the original text configuration
        newTemplate.schemas[pageIndex][finalFieldKey] = {
          type: "text",
          position: { x: xPosition, y: yPosition },
          width: 150,
          height: 15,
          fontSize: 12,
          alignment: "right", // For RTL
        };
      }
      
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

  // Add a new useEffect to apply additional LTR styling
  useEffect(() => {
    if (designerRef.current && isMounted) {
      // Find all PDF designer elements and force LTR direction
      const designerElements = designerRef.current.querySelectorAll('.pdfme-ui-designer, .pdfme-ui-designer-body, .pdfme-ui-designer-page-container');
      designerElements.forEach(el => {
        el.style.direction = 'ltr';
        el.style.textAlign = 'left';
      });
      
      // Also try to center the page container if it exists
      const pageContainer = designerRef.current.querySelector('.pdfme-ui-designer-page-container');
      if (pageContainer) {
        pageContainer.style.margin = '0 auto';
        pageContainer.style.display = 'flex';
        pageContainer.style.justifyContent = 'center';
      }
    }
  }, [isMounted, designerRef.current, file]);

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
    // Add signature fields
    { label: "חתימה", key: "signature" },
    { label: "חתימה של עובד", key: "signature_image" },
    { label: "חתימה של אדם", key: "signaturePerson" },
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
    <div 
      className={styles.container}
      style={{
        direction: "rtl",
        textAlign: "right"
      }}
    >
      <div 
        className={styles.header}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "end",
        }}
      >
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

      <div style={{ height: "calc(100vh - 80px)", position: "relative", width: "100%" }}
      >
        <div className={styles.viewer}>
          <div
            ref={loadRef}
            style={{ 
              width: "100%", 
              height: "100%", 
              border: "1px solid #eee",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              direction: "ltr"
            }}
          />
        </div>

        {isMounted && showDictionary && (
          <Draggable handle=".drag-handle" nodeRef={dictionaryNodeRef}>
            <div 
              ref={dictionaryNodeRef}
              style={{
                position: "fixed",
                left: 20,
                top: 100,
                maxHeight: "calc(100vh - 150px)",
                width: "350px",
                backgroundColor: "white",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                zIndex: 1000,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div 
                className="drag-handle"
                style={{
                  padding: "15px 20px",
                  background: "#f8f9fa",
                  borderBottom: "1px solid #eee",
                  cursor: "move",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
                  מילון שדות אוטומטיים
                </h2>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ cursor: "move", color: "#666" }}>≡</span>
                  <span
                    onClick={() => setShowDictionary(false)}
                    style={{
                      cursor: "pointer",
                      color: "#666",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                    }}
                  >
                    ✕
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: "15px",
                  overflowY: "auto",
                  flex: 1,
                  direction: "rtl",
                  textAlign: "right",
                }}
              >
                <div style={{ marginBottom: "15px" }}>
                  <input
                    type="text"
                    placeholder="חיפוש שדה..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      direction: "rtl",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#666",
                    marginBottom: "15px",
                    lineHeight: 1.4,
                  }}
                >
                  במידה ותרצו להשתמש במילוי בפרטים באופן אוטומטי במסמכי העובד יש
                  להזין את שם השדה לפי המילון
                  <br />
                  <span style={{ fontSize: "0.8rem", color: "#888" }}>
                    לצורך חזרה על שדה ניתן להגדיר את שם השדה עם ספרה בסופו. למשל
                    worker_first_name1, worker_first_name2 וכו
                  </span>
                </p>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    direction: "rtl",
                    textAlign: "right",
                  }}
                >
                  {filteredDictionary.map(({ label, key }) => (
                    <li
                      key={key}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        background: "#fff",
                        border: "1px solid #eee",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
                          <strong>{label}</strong>{" "}
                          <span style={{ fontSize: "0.8rem", color: "#666" }}>{key}</span>
                        </div>
                        <button
                          onClick={() => handleAddField(key)}
                          style={{
                            padding: "5px 10px",
                            background: "#f5f5f5",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          הוסף
                        </button>
                      </div>
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