"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import Spinner from "@/components/spinner";
import Modal from "@/components/modal";
import { useRouter } from "next/navigation";
import { createSignedUploadURLs } from "@/app/(backend)/actions/assets/createSignedUploadURLs";
import { uploadDocument } from "@/app/(backend)/actions/workers/document/uploadDocument";
import PDFTemplateForm from "@/components/pdf/PDFTemplateForm";
import { generate } from "@pdfme/generator";
import { getFontsData, getPlugins, getDefaultSchema } from "@/lib/utils/pdfHelper";
import { nanoid } from "nanoid";
import { getLanguageFromCountryCode, getTranslations } from "@/lib/utils/languageMappings";
import SaveModal from "@/components/modals/SaveModal";
import styles from "@/styles/containers/workers/signedForm/formEditor.module.scss";

// Initial values for document fields
const initialFieldValues = {
  name: "",
  category: "",
  note: "",
};

/**
 * Form Editor component for handling PDF templates
 */
function FormEditor({
  file,
  workerId,
  workerDetails,
  organizationSettings,
  source,
  categories,
  countryCode = "376", // Default to Israel
}) {
  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [processedTemplate, setProcessedTemplate] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [fields, setFields] = useState(initialFieldValues);
  const [error, setError] = useState(null);
  
  // References
  const confirmedFileBlobToUpload = useRef(null);
  const router = useRouter();
  
  // Get translations
  const language = getLanguageFromCountryCode(countryCode);
  const translations = getTranslations(language);

  // Default fallback translations
  const defaultTranslations = {
    formEditor: "Form Editor",
    formDetails: "Form Details",
    formName: "Form Name",
    worker: "Worker",
    pdfEditor: "PDF Editor",
    loadingTemplate: "Loading template...",
    cancel: "Cancel",
    saveDocument: "Save Document",
    saveAndUpload: "Save and Upload",
    tryAgain: "Try Again",
    pdfErrorMessage: "There was an error loading the PDF editor. Please try again."
  };

  // Ensure all translation keys have values
  for (const key in defaultTranslations) {
    if (!translations[key]) {
      translations[key] = defaultTranslations[key];
    }
  }

  // Process template when file changes
  useEffect(() => {
    if (file) {
      try {
        console.log("Processing template:", JSON.stringify(file).substring(0, 200) + "...");
        
        // Process template to ensure proper structure
        let processedFile = { ...file };
        
        // Fix basePdf URL if it's a JSON URL
        if (processedFile.basePdf && processedFile.basePdf.includes('.json')) {
          console.log("Converting JSON URL to PDF URL");
          
          const originalUrl = processedFile.basePdf;
          
          if (originalUrl.includes('amazonaws.com')) {
            try {
              // Convert JSON URL to PDF URL
              const baseUrlParts = originalUrl.split('?')[0];
              const urlWithoutQuery = baseUrlParts
                .replace('/digital_form_pdf_template_json/', '/digital_form_pdf_template_pdf/')
                .replace('/original.json', '/original.pdf');
              
              // Add back query params if any
              const queryParams = originalUrl.includes('?') ? 
                `?${originalUrl.split('?')[1]}` : '';
                
              processedFile.basePdf = urlWithoutQuery + queryParams;
            } catch (error) {
              console.error("Error converting JSON URL to PDF URL:", error);
              processedFile.basePdf = getMinimalPdfDataUrl();
            }
          } else {
            processedFile.basePdf = getMinimalPdfDataUrl();
          }
        }
        
        // Process the template to ensure correct structure
        const processed = ensureTemplateStructure(processedFile);
        
        setProcessedTemplate(processed);
        setError(null);
      } catch (error) {
        console.error("Error processing template:", error);
        toast.error(`Error processing template: ${error.message}`);
        setError(error.message);
        
        // Fallback to default schema
        setProcessedTemplate(getDefaultSchema());
      }
    }
  }, [file]);

  // Ensure the template has the correct structure
  const ensureTemplateStructure = (template) => {
    if (!template) return getDefaultSchema();
    
    try {
      // Create simplified template structure
      const simplified = {
        basePdf: template.basePdf || getMinimalPdfDataUrl(),
        schemas: [{
          pages: [{
            width: 595,
            height: 842,
            elements: template.schemas?.[0]?.pages?.[0]?.elements || []
          }]
        }],
        id: template.id || nanoid(),
        name: template.name || "Form Template"
      };
      
      console.log("Created simplified template structure");
      return simplified;
    } catch (error) {
      console.error("Error creating simplified template:", error);
      return getDefaultSchema();
    }
  };

  // Function to get a minimal PDF data URL
  const getMinimalPdfDataUrl = () => {
    return "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G";
  };

  // Handle form submission
  const handleFormSubmit = async (pdfBlob) => {
    confirmedFileBlobToUpload.current = pdfBlob;
    setShowSaveModal(true);
    
    // Set default document name from template if it exists
    if (file?.name && !fields.name) {
      setFields(prev => ({
        ...prev,
        name: `${file.name} - ${workerDetails?.firstName || ""} ${workerDetails?.lastName || ""}`.trim()
      }));
    }
  };

  // Handle saving document
  const handleSaveDocument = async () => {
    try {
      setIsLoading(true);
      
      // Validate form fields
      if (!fields.name) {
        toast.error("Please enter a document name");
        setIsLoading(false);
        return;
      }
      
      const pdfBlob = confirmedFileBlobToUpload.current;
      
      if (!pdfBlob) {
        throw new Error("No PDF data available");
      }

      // Get signed upload URLs
      const signedUrlResponse = await createSignedUploadURLs({
        files: [{ ext: ".pdf", type: "application/pdf" }],
      });

      if (!signedUrlResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const uploadUrl = signedUrlResponse.data[0].url;
      const assetId = signedUrlResponse.data[0].assetId;

      // Upload the PDF to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/pdf",
        },
        body: pdfBlob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Create document record in the database
      const documentResponse = await uploadDocument({
        workerId: workerId,
        documentAssetId: assetId,
        documentType: "SIGNED",
        name: fields.name,
        simpleCategoryId: fields.category || null,
        note: fields.note || null,
      });

      if (!documentResponse.ok) {
        throw new Error(documentResponse.message || "Failed to save document");
      }

      toast.success("Document saved successfully");
      setShowSaveModal(false);
      
      // Navigate back to the documents list
      router.back();
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error(`Failed to save document: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format category options
  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name || "Unnamed Category",
  }));

  return (
    <>
      <div className={styles.container}>
        <h2 className={styles.title}>{translations.formEditor}</h2>
        
        {/* Basic form details */}
        <div className={styles.detailsSection}>
          <h3 className={styles.sectionTitle}>{translations.formDetails}</h3>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <label className={styles.detailLabel}>{translations.formName}</label>
              <div className={styles.detailValue}>{file?.name || '-'}</div>
            </div>
            <div className={styles.detailItem}>
              <label className={styles.detailLabel}>{translations.worker}</label>
              <div className={styles.detailValue}>{workerDetails?.firstName} {workerDetails?.lastName}</div>
            </div>
          </div>
        </div>
        
        {/* PDF Editor section */}
        <div className={styles.editorSection}>
          <h3 className={styles.sectionTitle}>{translations.pdfEditor}</h3>
          
          {/* Clear container for the PDF form */}
          <div className={styles.pdfFormWrapper}>
            {error ? (
              <div className={styles.pdfErrorContainer}>
                <h4 className={styles.pdfErrorTitle}>{translations.pdfErrorMessage}</h4>
                <p className={styles.pdfErrorText}>{error}</p>
                <button 
                  className={styles.submitButton} 
                  onClick={() => window.location.reload()}
                >
                  {translations.tryAgain}
                </button>
              </div>
            ) : processedTemplate ? (
              <PDFTemplateForm
                template={processedTemplate}
                workerDetails={workerDetails}
                organizationSettings={organizationSettings}
                countryCode={countryCode}
                onSubmit={handleFormSubmit}
                source={source}
              />
            ) : (
              <div className={styles.loaderContainer}>
                <Spinner />
                <span className={styles.loaderText}>{translations.loadingTemplate}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className={styles.actionButtonsContainer}>
          <button
            onClick={() => router.back()}
            className={styles.cancelButton}
          >
            {translations.cancel}
          </button>
        </div>
      </div>

      {/* Document Save Modal */}
      <SaveModal 
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveDocument}
        title={translations.saveDocument}
        isLoading={isLoading}
        fields={fields}
        setFields={setFields}
        categories={categories}
      />
    </>
  );
}

export default FormEditor; 