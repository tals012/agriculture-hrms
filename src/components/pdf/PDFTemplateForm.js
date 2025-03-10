"use client";

import { getFontsData, getPlugins } from "@/lib/utils/pdfHelper";
import { getLanguageFromCountryCode, getTranslations } from "@/lib/utils/languageMappings";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Form } from "@pdfme/ui";
import { generate } from "@pdfme/generator";
import dayjs from "dayjs";
import Spinner from "@/components/spinner";
import Modal from "@/components/modal";
import styles from "@/styles/components/pdf/pdfTemplateForm.module.scss";

// Signature Dialog Component
const SignatureDialog = ({ open, onClose, onSave, translations }) => {
  const [signature, setSignature] = useState("");
  const [error, setError] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawMode, setIsDrawMode] = useState(false);

  useEffect(() => {
    if (open && isDrawMode && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "black";
    }
  }, [open, isDrawMode]);

  const handleSave = () => {
    if (!signature && !isDrawMode) {
      setError(true);
      return;
    }

    if (isDrawMode && canvasRef.current) {
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL("image/png");
      onSave(signatureData);
    } else {
      onSave(signature);
    }
    
    onClose();
  };

  const handleClear = () => {
    if (isDrawMode && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      setSignature("");
    }
    setError(false);
  };

  const handleMouseDown = (e) => {
    if (!isDrawMode) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
  };

  const handleMouseMove = (e) => {
    if (!isDrawMode || !isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    
    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (!isDrawMode) return;
    setIsDrawing(false);
  };

  return (
    <Modal
      isOpen={open}
      title={translations.createSignature || "Create Signature"}
      onClose={onClose}
    >
      <div className={styles.dialogContent}>
        <div className={styles.tabContainer}>
          <button
            className={!isDrawMode ? styles.activeTab : styles.inactiveTab}
            onClick={() => setIsDrawMode(false)}
          >
            {translations.typeSignature || "Type"}
          </button>
          <button
            className={isDrawMode ? styles.activeTab : styles.inactiveTab}
            onClick={() => setIsDrawMode(true)}
          >
            {translations.drawSignature || "Draw"}
          </button>
        </div>

        {!isDrawMode ? (
          <div className={styles.inputContainer}>
            <input
              type="text"
              value={signature}
              onChange={(e) => {
                setSignature(e.target.value);
                setError(false);
              }}
              placeholder={translations.typeHere || "Type your signature here"}
              className={`${styles.textInput} ${error ? styles.hasError : ""}`}
            />
            {error && (
              <p className={styles.errorText}>
                {translations.errorMessage || "Signature is required"}
              </p>
            )}
          </div>
        ) : (
          <div>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className={styles.signatureCanvas}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        )}

        <div className={styles.dialogActions}>
          <button
            onClick={handleClear}
            className={styles.secondaryButton}
          >
            {translations.clear || "Clear"}
          </button>
          <button
            onClick={onClose}
            className={styles.secondaryButton}
          >
            {translations.cancel || "Cancel"}
          </button>
          <button
            onClick={handleSave}
            className={styles.primaryButton}
          >
            {translations.save || "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * PDF Template Form Component
 */
const PDFTemplateForm = ({
  template,
  workerDetails,
  organizationSettings,
  onSubmit,
  source,
  countryCode = "376", // Default to Israel
}) => {
  // Core refs
  const containerRef = useRef(null);
  const formRef = useRef(null);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formInstance, setFormInstance] = useState(null);
  const [signatureField, setSignatureField] = useState(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  
  // Get language and translations
  const language = getLanguageFromCountryCode(countryCode);
  const translations = getTranslations(language);
  const isRTL = language === 'he' || language === 'ar';

  // Initialize the form when the component mounts
  useEffect(() => {
    let isMounted = true;
    
    const initForm = async () => {
      if (!containerRef.current || !template) return;

      try {
        setIsLoading(true);
        
        // Create form inputs
        const inputs = [createInputData()];

        // Get plugins
        const plugins = getPlugins();
        
        // Log template structure
        console.log("Initializing form with template:", {
          id: template?.id || 'unknown',
          hasBasePdf: !!template?.basePdf,
          schemaCount: template?.schemas?.length || 0
        });

        // Simplify the template to avoid validation issues
        const simplifiedTemplate = {
          basePdf: template.basePdf,
          schemas: [{
            pages: [{
              width: 595,
              height: 842,
              elements: template.schemas?.[0]?.pages?.[0]?.elements || []
            }]
          }]
        };
      
        // Create form instance with simplified template
        const instance = new Form({
          domContainer: containerRef.current,
          template: simplifiedTemplate,
          inputs,
          options: {
            language: 'en', // pdfme/ui only supports 'en' and 'ja'
            plugins
          }
        });
        
        // Store form instance
        formRef.current = instance;
        
        // Find signature fields after a delay
        setTimeout(() => {
          if (isMounted) {
            findSignatureFields();
          }
        }, 500);
      } catch (err) {
        console.error("Error initializing PDF form:", err);
        setError(`Failed to initialize PDF form: ${err.message}`);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    initForm();
    
    return () => {
      isMounted = false;
      if (formRef.current) {
        try {
          formRef.current.destroy();
        } catch (err) {
          console.error("Error destroying form:", err);
        }
      }
    };
  }, [template]);

  // Create input data for the form
  const createInputData = () => {
    return {
      // Worker details
      firstName: workerDetails?.firstName || "",
      lastName: workerDetails?.lastName || "",
      fullName: `${workerDetails?.firstName || ""} ${workerDetails?.lastName || ""}`.trim(),
      idNumber: workerDetails?.idNumber || "",
      phone: workerDetails?.phone || "",
      email: workerDetails?.email || "",
      
      // Company details
      companyName: organizationSettings?.companyName || "",
      companyAddress: organizationSettings?.address || "",
      companyPhone: organizationSettings?.phone || "",
      companyEmail: organizationSettings?.email || "",
      
      // Date
      currentDate: dayjs().format("DD/MM/YYYY"),
      
      // Add current year
      currentYear: dayjs().format("YYYY"),
      
      // Empty signatures
      signature: ""
    };
  };

  // Find signature fields in the form
  const findSignatureFields = () => {
    try {
      // Look for signature fields in the document
      const signatureElements = document.querySelectorAll('.signature');
      
      if (!signatureElements || signatureElements.length === 0) {
        console.log("No signature fields found");
        return;
      }
      
      console.log(`Found ${signatureElements.length} signature fields`);
      
      // Set up each signature field
      signatureElements.forEach((element, index) => {
        // Add styling and placeholders
        element.style.cursor = 'pointer';
        element.style.border = '1px dashed #3b82f6';
        element.style.borderRadius = '4px';
        element.style.padding = '4px';
        element.title = translations.signHere || 'Click to sign';
        
        // Add placeholder text if empty
        if (!element.textContent.trim()) {
          element.textContent = translations.signHere || 'Click to sign';
        }
        
        // Add click handler
        element.addEventListener('click', () => {
          setSignatureField(element);
          setShowSignatureDialog(true);
        });
      });
    } catch (err) {
      console.error("Error setting up signature fields:", err);
    }
  };

  // Handle signature save
  const handleSignatureSave = (signatureData) => {
    if (!signatureField) return;
    
    // Display the signature in the field
    if (signatureData.startsWith('data:image')) {
      // Display as image
      signatureField.innerHTML = '';
      signatureField.style.backgroundImage = `url(${signatureData})`;
      signatureField.style.backgroundSize = 'contain';
      signatureField.style.backgroundPosition = 'center';
      signatureField.style.backgroundRepeat = 'no-repeat';
      signatureField.style.minHeight = '50px';
    } else {
      // Display as text
      signatureField.innerHTML = `
        <div style="font-family: 'cursive', cursive; font-size: 1.25rem; color: #000;">${signatureData}</div>
      `;
    }
    
    // Remove styling
    signatureField.style.border = 'none';
    
    // Mark as signed
    signatureField.setAttribute('data-signed', 'true');
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      if (!template) {
        throw new Error("No template available");
      }
      
      // Create input data
      const inputData = createInputData();
      
      // Generate PDF using helper function
      const pdfArrayBuffer = await generate({
        template,
        inputs: [inputData],
        options: {
          font: await getFontsData(),
          plugins: getPlugins()
        }
      });
      
      // Convert to blob
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      
      // Call onSubmit with the PDF blob
      if (onSubmit) {
        onSubmit(pdfBlob);
      }
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError(`Failed to generate PDF: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback content when there's an error
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <div className={styles.errorTitle}>{translations.error || "Error"}</div>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className={styles.primaryButton}
          >
            {translations.tryAgain || "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={styles.container}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Container for PDF form */}
      <div 
        ref={containerRef} 
        className={styles.pdfContainer}
      ></div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className={styles.loaderContainer}>
          <Spinner />
          <span className={styles.loaderText}>{translations.loading || "Loading..."}</span>
        </div>
      )}
      
      {/* Form controls */}
      <div className={styles.formControls}>
        <button
          onClick={handleSubmit}
          className={styles.primaryButton}
          disabled={isLoading}
        >
          {translations.generateDocument || "Generate Document"}
        </button>
      </div>
      
      {/* Signature dialog */}
      <SignatureDialog 
        open={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        onSave={handleSignatureSave}
        translations={translations}
      />
    </div>
  );
};

export default PDFTemplateForm; 