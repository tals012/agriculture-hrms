"use client";

import React, { useCallback, useState, useEffect } from "react";
import TemplatesDropdown from "./TemplatesDropdown";
import FormEditor from "./FormEditor";
import Spinner from "@/components/spinner";
import { toast } from "react-toastify";
import Modal from "@/components/modal";
import { useRouter } from "next/navigation";
import { createSignedUploadURLs } from "@/app/(backend)/actions/assets/createSignedUploadURLs"; 
import { uploadDocument } from "@/app/(backend)/actions/workers/document/uploadDocument";
import { getWorkerDocumentCategories } from "@/app/(backend)/actions/workers/document/getWorkerDocumentCategories";
import { getWorkerDetails } from "@/app/(backend)/actions/workers/getWorkerDetails";
import { sendForRemoteSignature } from "@/app/(backend)/actions/workers/document/sendForRemoteSignature";
import { z } from "zod";
import { getWorkerTemplateCategories } from "@/app/(backend)/actions/workers/documentCategory/getWorkerTemplateCategories";
import styles from "@/styles/containers/workers/signedForm/form.module.scss";

const initialFieldValues = {
  name: "",
  category: "",
  note: "",
};

const Form = ({ workerId, source }) => {
  const [selectedTemplate, setSelectedTemplate] = useState({
    id: null,
    link: "",
    name: "",
  });
  const [showSendForSignatureModal, setShowSendForSignatureModal] = useState(false);
  const [fields, setFields] = useState(initialFieldValues);
  const router = useRouter();

  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [workerDetails, setWorkerDetails] = useState(null);
  const [organizationSettings, setOrganizationSettings] = useState({
    companyName: "",
    address: "",
    phone: "",
    email: "",
  });

  // Fetch worker details
  useEffect(() => {
    const fetchWorkerDetails = async () => {
      try {
        setIsLoading(true);
        const response = await getWorkerDetails({ workerId });
        if (response.ok && response.data) {
          setWorkerDetails(response.data);
        } else {
          toast.error("Failed to load worker details");
        }
      } catch (error) {
        console.error("Error fetching worker details:", error);
        toast.error("Failed to load worker details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkerDetails();
  }, [workerId]);

  // Fetch document categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        // const response = await getWorkerDocumentCategories();
        const response = await getWorkerTemplateCategories();
        if (response?.ok && Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          console.error("Invalid categories response:", response);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const loadRemoteFile = useCallback(async (_link) => {
    try {
      setIsLoading(true);
      const res = await fetch(_link);

      if (res.ok) {
        const json = await res.json();
        setFile(json);
      } else {
        toast.error("Failed to load the file.");
      }
    } catch (e) {
      toast.error("Failed to load the file.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onSendForSignature = useCallback(async () => {
    if (!fields.name) {
      toast.error("Please enter a document name");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const res = await sendForRemoteSignature({
        documentId: selectedTemplate.id,
        workerId,
        phone: workerDetails?.phone || "",
        name: fields.name,
        simpleCategoryId: fields.category || "",
        note: fields.note || "",
      });
      
      if (res.ok) {
        toast.success("Document sent for signature successfully");
        setShowSendForSignatureModal(false);
        router.replace(`/admin/workers/?tab=documents&workerId=${workerId}`);
      } else {
        console.error("Error response:", res);
        toast.error(res.message || "Failed to send document for signature");
      }
    } catch (e) {
      console.error("Error sending for signature:", e);
      toast.error("Failed to send the file for signature.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTemplate.id, workerId, fields, workerDetails?.phone, router]);

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name || "Unnamed Category",
  }));

  console.log(file, "file");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>הפקת וחתימת מסמכים</h2>
        <p className={styles.description}>יש לבחור במסמך הרצוי</p>
        
        <hr className={styles.divider} />
        
        <div className={styles.actionBar}>
          <TemplatesDropdown
            selectedTemplate={selectedTemplate}
            onChange={(id, link, name) => {
              if (link !== selectedTemplate?.link) {
                setSelectedTemplate({ id, link, name });
                loadRemoteFile(link);
              }
            }}
          />
          
          {!!selectedTemplate?.id && (
            <button
              className={styles.signatureButton}
              onClick={() => {
                setShowSendForSignatureModal(true);
                setFields(prev => ({
                  ...prev, 
                  name: selectedTemplate.name || "Template Document"
                }));
              }}
              disabled={isLoading}
            >
              {isLoading ? <Spinner /> : "שליחה לחתימה מרחוק"}
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.editorContainer}>
        {!!file && (
          <FormEditor
            key={file.id}
            file={file}
            workerId={workerId}
            workerDetails={workerDetails}
            organizationSettings={organizationSettings}
            source={source}
            categories={categories}
          />
        )}
      </div>
      
      {/* Send for Signature Modal */}
      <Modal
        isOpen={showSendForSignatureModal}
        title="שליחה לחתימה מרחוק"
        onClose={() => {
          if (!isLoading) setShowSendForSignatureModal(false);
        }}
      >
        <div className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              שם המסמך
            </label>
            <input
              type="text"
              value={fields.name}
              onChange={(e) => setFields(prev => ({ ...prev, name: e.target.value }))}
              className={styles.textInput}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              קטגוריה
            </label>
            <select
              value={fields.category}
              onChange={(e) => setFields(prev => ({ ...prev, category: e.target.value }))}
              className={styles.selectInput}
              disabled={isLoading || loadingCategories}
            >
              <option value="">בחר קטגוריה</option>
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              הערות למסמך
            </label>
            <textarea
              value={fields.note}
              onChange={(e) => setFields(prev => ({ ...prev, note: e.target.value }))}
              className={styles.textArea}
              rows={3}
              disabled={isLoading}
            />
          </div>
          
          <div className={styles.buttonContainer}>
            <button
              onClick={() => setShowSendForSignatureModal(false)}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              ביטול
            </button>
            <button
              onClick={onSendForSignature}
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? <Spinner /> : "שליחה לחתימה"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default React.memo(Form); 