"use client";

import React, { useRef, useState, useEffect } from "react";
import { toast } from "react-toastify";
import Draggable from "react-draggable";
import { Designer } from "@pdfme/ui";
import { getFontsData, readFile, cloneDeep, getPlugins } from "./helper";
import * as pdfjsLib from "pdfjs-dist";
import MenuIcon from "@mui/icons-material/Menu";
// import Button from "@mui/material/Button";
import styles from "@/styles/components/pdfEditor.module.scss";

const headerHeight = 150;

const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64.split(",")[1]); // Remove the Base64 prefix
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const getTotalPages = async (arrayBuffer) => {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  return pdfDocument.numPages;
};

function PDFEditor({ file, onSavePdfTemplate, onChangeBasePDF }) {
  const designerRef = useRef(null);
  const designer = useRef(null);
  const [predefinedTemplates, setPredefinedTemplates] = useState([]);
  const [showTemplatesList, setShowTemplatesList] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [showDictionary, setShowDictionary] = useState(false);

  // Refs for draggable components
  const dictionaryNodeRef = useRef(null);
  const templatesNodeRef = useRef(null);

  // Fetch predefined templates
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates/list-predefined");
        if (res.ok) {
          const templates = await res.json();
          setPredefinedTemplates(templates);
        }
      } catch (error) {
        console.error("Error fetching predefined templates:", error);
      }
    }
    fetchTemplates();
  }, []);

  const [isDesignerReady, setIsDesignerReady] = useState(false);

  const buildDesigner = React.useCallback((_file) => {
    const template = { schemas: [] };

    readFile(_file, "dataURL").then(async (basePdf) => {
      template.basePdf = basePdf;
      getFontsData().then(async (font) => {
        const arrayBuffer = base64ToArrayBuffer(template.basePdf);
        const pages = await getTotalPages(arrayBuffer);
        setTotalPages(pages);
        if (designerRef.current) {
          designer.current = new Designer({
            domContainer: designerRef.current,
            template,
            options: {
              font,
              labels: {
                addNewField: "הוספת שדה חדש",
                clear: "🗑️ נקה",
              },
              theme: {
                token: {
                  colorPrimary: "#25c2a0",
                },
              },
            },
            plugins: getPlugins(),
          });
        }
      });
    });
  }, []);

  const onSave = async (json) => {
    const blob = new Blob([JSON.stringify(json)], {
      type: "application/json",
    });
    onSavePdfTemplate(blob);
  };

  const handleAddField = (fieldKey) => {
    if (!designer.current) return;

    const _template = cloneDeep(designer.current.getTemplate());
    const pageCursor = designer.current.getPageCursor();

    if (_template.schemas.length === 0) {
      Array.from({ length: totalPages }).forEach(() => {
        _template.schemas.push({});
      });
    }

    // Check for existing fields across all pages
    let nextNumber = 0;
    let finalFieldKey = fieldKey;
    const allExistingFields = _template.schemas.reduce((acc, schema) => {
      return [...acc, ...Object.keys(schema)];
    }, []);

    if (allExistingFields.includes(fieldKey)) {
      allExistingFields.forEach((field) => {
        if (field.startsWith(fieldKey)) {
          const match = field.match(new RegExp(`^${fieldKey}(\\d+)?$`));
          if (match) {
            const num = match[1] ? parseInt(match[1]) : 0;
            nextNumber = Math.max(nextNumber, num + 1);
          }
        }
      });
      finalFieldKey = `${fieldKey}${nextNumber}`;
    }

    // Determine if this is a signature field based on the field name
    const isSignatureField = 
      finalFieldKey.toLowerCase().includes('signature') || 
      finalFieldKey.toLowerCase() === 'sign' ||
      finalFieldKey.toLowerCase().includes('_sign');
    
    console.log(`Adding field: ${finalFieldKey}, detected as ${isSignatureField ? 'signature' : 'text'} type`);

    const schema = _template.schemas[pageCursor];
    
    if (isSignatureField) {
      // For signature fields, create with signature type and appropriate dimensions
      schema[finalFieldKey] = {
        type: "signature",
        position: {
          x: 0,
          y: 0,
        },
        width: 170,
        height: 40,
        rotate: 0,
        opacity: 1,
      };
    } else {
      // For regular text fields, use the original text configuration
      schema[finalFieldKey] = {
        type: "text",
        position: {
          x: 0,
          y: 0,
        },
        width: 45,
        height: 10,
        rotate: 0,
        alignment: "left",
        verticalAlignment: "top",
        fontSize: 13,
        lineHeight: 1,
        characterSpacing: 0,
        fontColor: "#000000",
        backgroundColor: "",
        opacity: 1,
      };
    }

    if (!_template.columns?.includes(finalFieldKey)) {
      _template.columns = _template.columns || [];
      _template.columns.push(finalFieldKey);
    }

    _template.schemas[pageCursor] = schema;
    designer.current.updateTemplate(_template);
    designer.current.saveTemplate();
  };

  const handleSaveAsPredefined = async () => {
    if (!designer.current) return;
    setShowSaveDialog(true);
  };

  const handleSaveTemplate = async () => {
    if (!designer.current || !templateName.trim()) return;

    const template = designer.current.getTemplate();
    const templateJson = {
      name: templateName.trim(),
      basePdf: template.basePdf,
      schemas: template.schemas,
      columns: template.columns || [],
    };

    try {
      const res = await fetch("/api/templates/save-predefined", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateJson),
      });

      if (res.ok) {
        // Refresh the templates list
        const templatesRes = await fetch("/api/templates/list-predefined");
        if (templatesRes.ok) {
          const templates = await templatesRes.json();
          setPredefinedTemplates(templates);
        }

        setShowSaveDialog(false);
        setTemplateName("");
        toast.success("Template saved successfully!", {
          position: "top-center",
        });
      } else {
        toast.error("Failed to save template!", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error saving predefined template:", error);
      toast.error("Failed to save template!", {
        position: "top-center",
      });
    }
  };

  React.useEffect(() => {
    if (isDesignerReady && file) {
      buildDesigner(file);
    }

    return () => {
      if (designer.current) {
        designer.current.destroy();
      }
    };
  }, [isDesignerReady, file, buildDesigner]);

  const loadRef = React.useCallback((r) => {
    if (r) {
      designerRef.current = r;
      setIsDesignerReady(true);
    }
  }, []);

  return (
    <div
      className={styles.container}
      style={{
        direction: "rtl",
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
        <div className={styles.buttons}>
          <button
            onClick={() => setShowDictionary(!showDictionary)}
            className={styles.button}
          >
            {showDictionary ? "הסתר מילון" : "הצג מילון השלמה אוטומטית"}
          </button>
          <button onClick={handleSaveAsPredefined} className={styles.button}>
            שמור כתבנית מוגדרת מראש
          </button>
          <button
            onClick={() => setShowTemplatesList(!showTemplatesList)}
            className={styles.button}
          >
            {showTemplatesList ? "הסתר תבניות" : "הצג תבניות שמורות"}
          </button>
          <button
            onClick={() => {
              onSave(designer.current.getTemplate());
            }}
            className={styles.button}
          >
            סיום והעלאת מסמך
          </button>
          <button
            className={styles.button}
            onClick={() => {
              onChangeBasePDF();
            }}
          >
            בחירת מסמך חדש
          </button>
        </div>
      </div>

      {showDictionary && (
        <Draggable handle=".drag-handle" nodeRef={dictionaryNodeRef}>
          <div
            ref={dictionaryNodeRef}
            className={styles.dictionary}
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
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <MenuIcon style={{ cursor: "move", color: "#666" }} />
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
                {[
                  { label: "שם מלא", key: "worker_full_name" },
                  { label: "שם פרטי", key: "worker_first_name" },
                  { label: "שם משפחה", key: "worker_last_name" },
                  { label: "מספר דרכון", key: "worker_passport" },
                  { label: "תעודת זהות", key: "worker_id" },
                  { label: "תאריך לידה", key: "worker_dob" },
                  { label: "טלפון", key: "worker_phone" },
                  { label: "תאריך נוכחי", key: "current_date" },
                  { label: "מקצוע", key: "professionHebrew" },
                  { label: "תאריך תחילת עבודה", key: "worker_start_date" },
                  {
                    label: "תאריך כניסה ראשוני לישראל",
                    key: "firstIsraelEntryDate",
                  },
                  { label: "תאריך סיום העסקה", key: "contractTerminationDate" },
                  { label: "תאריך בריחה", key: "escapeDate" },
                  {
                    label: "תאריך הודעת פיטורין",
                    key: "dateOfDismissalNotice",
                  },
                  { label: "שם איש קשר בבית", key: "homeRelativeContactName" },
                  { label: "מספר טלפון בבית", key: "homePhoneNumber" },
                  {
                    label: "מספר טלפון של איש קשר בבית",
                    key: "homeRelativeContactPhoneNumber",
                  },
                  {
                    label: "יחס של איש קשר בבית",
                    key: "homeRelativeContactRelation",
                  },
                  {
                    label: "כתובת איש קשר בבית",
                    key: "homeRelativeContactAddress",
                  },
                  { label: "שם הבנק במדינת המוצא", key: "homeCountryBankName" },
                  {
                    label: "קוד הבנק במדינת המוצא",
                    key: "homeCountryBankCode",
                  },
                  {
                    label: "מספר סניף במדינת המוצא",
                    key: "homeCountryBranchNumber",
                  },
                  {
                    label: "מספר חשבון במדינת המוצא",
                    key: "homeCountryBankAccountIBAN",
                  },
                  { label: "שם הבנק בישראל", key: "israelBankHebrewName" },
                  { label: "סניף הבנק בישראל", key: "israelBankBranch" },
                  {
                    label: "מספר חשבון בישראל",
                    key: "israelBankAccountNumber",
                  },
                  { label: "שם הבנק להפקדות", key: "depositBankHebrewName" },
                  { label: "סניף הבנק להפקדות", key: "depositBankBranch" },
                  {
                    label: "מספר חשבון להפקדות",
                    key: "depositBankAccountNumber",
                  },
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
                  {
                    label: "תפקיד החותם באנגלית",
                    key: "signaturePersonTitleEnglish",
                  },
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
                  { label: "מספר סידורי", key: "worker_serial_number" },
                  {
                    label: "מספר סידורי קודם",
                    key: "worker_prev_serial_number",
                  },
                  { label: "מספר מדינה בעברית", key: "worker_country_hebrew" },
                  { label: "שם מדינה באנגלית", key: "worker_country_english" },
                  { label: "קוד מדינה (3 ספרות)", key: "worker_country_code" },
                  { label: "signature_image", key: "signature_image" },
                  { label: "signature", key: "signature" },
                ]
                  .filter(
                    ({ label, key }) =>
                      searchQuery === "" ||
                      label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      key.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(({ label, key }) => (
                    <li
                      key={key}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        background: "#fff",
                        border: "1px solid #eee",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          background: "#f8f9fa",
                          borderColor: "#e0e0e0",
                        },
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
                        <div className="flex flex-col direction-rtl text-right">
                          <strong>{label}</strong>{" "}
                          <span className={styles.key}>{key}</span>
                        </div>
                        <button
                          onClick={() => handleAddField(key)}
                          className={styles.button + " " + styles.secondary}
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

      {showTemplatesList && (
        <Draggable handle=".drag-handle" nodeRef={templatesNodeRef}>
          <div
            ref={templatesNodeRef}
            className={styles.dictionary}
            style={{
              position: "fixed",
              right: 20,
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
                תבניות שמורות
              </h2>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <MenuIcon style={{ cursor: "move", color: "#666" }} />
                <span
                  onClick={() => setShowTemplatesList(false)}
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
              {predefinedTemplates.length === 0 ? (
                <div style={{ textAlign: "center", color: "#666" }}>
                  אין תבניות שמורות
                </div>
              ) : (
                predefinedTemplates.map((template) => (
                  <div
                    key={template.path}
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                  >
                    {template.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </Draggable>
      )}

      {showSaveDialog && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>שמירת תבנית</h2>
            <div className={styles.modalContent}>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="שם התבנית"
                className={styles.input}
                autoFocus
              />
              <div className={styles.modalButtons}>
                <Button
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                >
                  שמור
                </Button>
                <Button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setTemplateName("");
                  }}
                  variant="secondary"
                >
                  ביטול
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.viewer}>
        <div
          ref={loadRef}
          style={{ width: "100%", height: `calc(100vh - ${headerHeight}px)` }}
        />
      </div>
    </div>
  );
}

export default PDFEditor;

const Button = ({ children, variant = "primary", bgc, w, h, mt, ...props }) => {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 500,
    fontSize: "0.9rem",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    cursor: "pointer",
    outline: "none",
    textAlign: "center",
    border: "none",
    padding: "8px 16px",
    width: w ? `${w}px` : "auto",
    height: h ? `${h}px` : "auto",
    marginTop: mt ? `${mt}px` : 0,
  };

  const variants = {
    primary: {
      backgroundColor: bgc || "#25c2a0",
      color: "#fff",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      "&:hover": {
        backgroundColor: "#1ca086",
      },
      "&:active": {
        transform: "translateY(1px)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
      },
      "&:disabled": {
        backgroundColor: "#a0dfcf",
        cursor: "not-allowed",
        boxShadow: "none",
      },
    },
    secondary: {
      backgroundColor: "#f5f5f5",
      color: "#333",
      border: "1px solid #ddd",
      "&:hover": {
        backgroundColor: "#eaeaea",
        borderColor: "#ccc",
      },
      "&:active": {
        transform: "translateY(1px)",
        backgroundColor: "#e0e0e0",
      },
      "&:disabled": {
        backgroundColor: "#f9f9f9",
        color: "#aaa",
        cursor: "not-allowed",
        border: "1px solid #eee",
      },
    },
  };

  const variantStyle = variants[variant] || variants.primary;

  // Merge styles
  const style = { ...baseStyle, ...variantStyle };

  // Apply hover, active and disabled styles directly on events rather than in CSS classes
  const handleMouseOver = (e) => {
    if (props.disabled) return;
    const hoverStyle = variantStyle["&:hover"];
    if (hoverStyle) {
      Object.keys(hoverStyle).forEach((key) => {
        e.currentTarget.style[key] = hoverStyle[key];
      });
    }
  };

  const handleMouseOut = (e) => {
    if (props.disabled) return;
    const hoverStyle = variantStyle["&:hover"];
    if (hoverStyle) {
      Object.keys(hoverStyle).forEach((key) => {
        e.currentTarget.style[key] = style[key] || "";
      });
    }
  };

  const handleMouseDown = (e) => {
    if (props.disabled) return;
    const activeStyle = variantStyle["&:active"];
    if (activeStyle) {
      Object.keys(activeStyle).forEach((key) => {
        e.currentTarget.style[key] = activeStyle[key];
      });
    }
  };

  const handleMouseUp = (e) => {
    if (props.disabled) return;
    const activeStyle = variantStyle["&:active"];
    if (activeStyle) {
      Object.keys(activeStyle).forEach((key) => {
        e.currentTarget.style[key] = style[key] || "";
      });
    }
  };

  // Filter out "&:" pseudo-selectors from style object
  const cleanStyle = Object.fromEntries(
    Object.entries(style).filter(([key]) => !key.startsWith("&:"))
  );

  // Apply disabled styles
  if (props.disabled && variantStyle["&:disabled"]) {
    Object.assign(cleanStyle, variantStyle["&:disabled"]);
  }

  return (
    <button
      style={cleanStyle}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {children}
    </button>
  );
};
