"use client";

import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import PDFEditor from "@/components/pdf/pdfEditor";
import Modal from "@/components/modal";
import { createSignedUploadURLs } from "@/app/(backend)/actions/assets/createSignedUploadURLs";
import { createWorkerFormTemplate } from "@/app/(backend)/actions/workers/documentTemplate/createWorkerFormTemplate";
import { getWorkerTemplateCategories } from "@/app/(backend)/actions/workers/documentCategory/getWorkerTemplateCategories";
import styles from "@/styles/containers/settings/templateDesigner.module.scss";

function TemplateDesigner() {
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCategoriesLoading, setShowCategoriesLoading] = useState(false);
  const uploadRef = useRef(null);
  const confirmedFileBlobToUpload = useRef(null);
  const router = useRouter();

  // Fetch categories when save dialog is opened
  const handleSaveDialogOpen = async () => {
    setShowSaveDialog(true);
    setShowCategoriesLoading(true);

    try {
      const res = await getWorkerTemplateCategories();
      if (res.ok && Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        toast.error("שגיאה בטעינת הקטגוריות");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("שגיאה בטעינת הקטגוריות");
    } finally {
      setShowCategoriesLoading(false);
    }
  };

  const onSelectFile = () => {
    if (uploadRef.current) {
      uploadRef.current.click();
    }
  };

  const onChangeInputFile = (e) => {
    const _file = e.target.files?.[0];
    if (_file) {
      setFile(_file);
    }
    if (uploadRef.current) {
      uploadRef.current.value = null;
    }
  };

  const onSaveTemplate = async (e) => {
    e.preventDefault();

    console.log("====onSaveTemplate====");
    
    if (!fileName.trim()) {
      toast.error("אנא הזן שם לתבנית");
      return;
    }

    try {
      setIsLoading(true);
      
      // Create signed upload URLs
      const signedUploadUrlsRes = await createSignedUploadURLs({
        files: [
          {
            ext: ".json",
            type: "DIGITAL_FORM_PDF_TEMPLATE_JSON",
          },
        ],
      });

      if (!signedUploadUrlsRes.ok) {
        throw new Error("Failed to create signed upload URLs");
      }

      const signedUploadUrl = 
        signedUploadUrlsRes.data[0].assetStorageFileUploadURL;
      const templateAssetId = signedUploadUrlsRes.data[0].assetId;

      console.log("signedUploadUrl", signedUploadUrl);
      console.log("templateAssetId", templateAssetId);

      // Upload the template JSON
      const uploadRes = await fetch(signedUploadUrl, {
        method: "PUT",
        body: confirmedFileBlobToUpload.current,
      });

      console.log("uploadRes", uploadRes);

      if (!uploadRes.ok) {
        throw new Error("Failed to upload the template");
      }

      // Create the template record
      const templateRes = await createWorkerFormTemplate({
        templateAssetId,
        name: fileName,
        templateCategoryId: selectedCategory || null,
      });

      if (!templateRes.ok) {
        throw new Error(templateRes.error || "Failed to create template");
      }

      toast.success("התבנית נשמרה בהצלחה!");
      router.push("/admin/settings?tab=document-management");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("שגיאה בשמירת התבנית: " + error.message);
    } finally {
      setIsLoading(false);
      setShowSaveDialog(false);
    }
  };

  return (
    <div className={styles.container}>
      {!file && (
        <div className={styles.uploadContainer}>
          <h2>העלאת תבנית חדשה</h2>
          <p>בחר קובץ PDF כדי להתחיל ביצירת תבנית</p>
          <button className={styles.uploadButton} onClick={onSelectFile}>
            העלאת מסמך חדש
          </button>
        </div>
      )}

      <input
        ref={uploadRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={onChangeInputFile}
      />

      {file && (
        <PDFEditor
          file={file}
          onChangeBasePDF={onSelectFile}
          onSavePdfTemplate={(fileBlob) => {
            confirmedFileBlobToUpload.current = fileBlob;
            handleSaveDialogOpen();
          }}
        />
      )}

      <Modal 
        isOpen={showSaveDialog} 
        onClose={() => setShowSaveDialog(false)} 
        title="שמירת תבנית"
      >
        <form onSubmit={onSaveTemplate} className={styles.saveForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name">שם התבנית *</label>
            <input
              type="text"
              id="name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="הזן שם לתבנית"
              className={styles.input}
              autoFocus
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">קטגוריה</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.select}
              disabled={showCategoriesLoading}
            >
              <option value="">בחר קטגוריה (אופציונלי)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setShowSaveDialog(false)}
              disabled={isLoading}
            >
              ביטול
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading || !fileName.trim()}
            >
              {isLoading ? "שומר..." : "שמור תבנית"}
            </button>
          </div>
        </form>
      </Modal>

      {isLoading && (
        <div className={styles.overlay}>
          <div className={styles.spinner}></div>
        </div>
      )}
    </div>
  );
}

export default TemplateDesigner; 