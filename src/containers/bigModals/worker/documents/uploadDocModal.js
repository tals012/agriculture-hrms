"use client";

import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import Spinner from "@/components/spinner";
import styles from "@/styles/containers/bigModals/worker/documents/uploadDocModal.module.scss";
import { createSignedUploadURLs } from "@/app/(backend)/actions/assets/createSignedUploadURLs";
import { 
  uploadMultipleDocuments,
  getWorkerDocumentCategories
} from "@/app/(backend)/actions/workers/document";

// SVG Icons
const UploadIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path d="M11 15H13V9H16L12 4L8 9H11V15Z" fill="currentColor" />
    <path
      d="M20 18H4V11H2V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V11H20V18Z"
      fill="currentColor"
    />
  </svg>
);

const CameraIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path
      d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2Z"
      fill="currentColor"
    />
    <path
      d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z"
      fill="currentColor"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path
      d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z"
      fill="currentColor"
    />
  </svg>
);

const CaptureIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <circle cx="12" cy="12" r="8" fill="white" />
    <circle cx="12" cy="12" r="6" fill="currentColor" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      fill="currentColor"
    />
  </svg>
);

export default function UploadDocModal({ workerId, onRefresh, onClose }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("");
  const [docNote, setDocNote] = useState("");
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Fetch document categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      
      const response = await getWorkerDocumentCategories();
      
      if (response.ok && response.data) {
        setCategories(response.data);
      } else {
        toast.error(response.message || "שגיאה בטעינת הקטגוריות");
        // Fallback to empty categories
        setCategories([]);
      }
    } catch (e) {
      console.error("Error fetching categories:", e);
      toast.error("שגיאה בטעינת הקטגוריות");
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    // Cleanup function to stop camera if modal is closed
    return () => {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle file input change
  const handleFileChange = (event) => {
    const fileList = event.target.files;
    addFiles(fileList);
  };

  // Add files to state
  const addFiles = (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;

    if (files.length + newFiles.length > 5) {
      toast.error("ניתן להעלות עד 5 קבצים בבת אחת");
      return;
    }

    const filesArray = Array.from(newFiles);
    setFiles((prev) => [...prev, ...filesArray]);
  };

  // Remove file
  const removeFile = (index) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      streamRef.current = stream;
      setIsCameraMode(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("אין גישה למצלמה");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraMode(false);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to file
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("שגיאה בצילום התמונה");
        return;
      }
      
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      
      addFiles([file]);
      stopCamera();
    }, "image/jpeg");
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  // Form submission
  const onSave = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast.error("יש לבחור לפחות קובץ אחד");
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Prepare file metadata for upload URL generation
      const fileMetadata = files.map(file => {
        const fileExt = file.name.substring(file.name.lastIndexOf('.'));
        return {
          type: "UNKNOWN", // Asset type for worker documents
          ext: fileExt,
          thumbnailExt: null, // No thumbnail for documents
        };
      });

      // Step 2: Generate signed upload URLs for S3
      const uploadUrlsResponse = await createSignedUploadURLs({
        files: fileMetadata
      });

      if (!uploadUrlsResponse.ok) {
        throw new Error(uploadUrlsResponse.error || "Failed to generate upload URLs");
      }

      // Step 3: Upload files to S3 using the signed URLs
      const uploadPromises = uploadUrlsResponse.data.map((urlData, index) => {
        return fetch(urlData.assetStorageFileUploadURL, {
          method: "PUT",
          body: files[index],
          headers: {
            "Content-Type": files[index].type
          }
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      // Check if all uploads to S3 were successful
      const failedUploads = uploadResults.filter(res => !res.ok);
      if (failedUploads.length > 0) {
        throw new Error(`${failedUploads.length} files failed to upload`);
      }

      // Step 4: Save document records in the database
      const documentNames = files.map(file => 
        docName ? docName : file.name.substring(0, file.name.lastIndexOf('.'))
      );
      
      const assetIds = uploadUrlsResponse.data.map(urlData => urlData.assetId);
      
      const result = await uploadMultipleDocuments({
        workerId,
        documentAssetIds: assetIds,
        documentType: "UPLOADED",
        names: documentNames,
        simpleCategoryId: docCategory || null,
        note: docNote || null,
        userId: null, // Will be handled by the server based on session
      });

      if (!result.ok) {
        throw new Error(result.message || "Failed to save document records");
      }

      toast.success("המסמכים הועלו בהצלחה");
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error(`שגיאה בהעלאת המסמכים: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalContainer}>
      <h2 className={styles.modalTitle}>העלאת מסמכים חדשים</h2>
      
      <form onSubmit={onSave}>
        {/* File upload area */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            קבצים
          </label>
          
          <div className={styles.buttonRow}>
            <button
              type="button"
              onClick={() => document.getElementById("fileInput").click()}
              className={`${styles.button} ${styles.primary}`}
            >
              <UploadIcon />
              <span>בחר קבצים</span>
            </button>
            
            <button
              type="button"
              onClick={startCamera}
              className={`${styles.button} ${styles.primary}`}
            >
              <CameraIcon />
              <span>צלם מסמך</span>
            </button>
          </div>
          
          {isCameraMode ? (
            <div className={styles.cameraContainer}>
              <video ref={videoRef} autoPlay playsInline></video>
              <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
              <button className={styles.captureButton} onClick={takePhoto}>
                <CaptureIcon />
              </button>
              <button className={styles.closeButton} onClick={stopCamera}>
                <CloseIcon />
              </button>
            </div>
          ) : (
            <div
              className={`${styles.dropArea} ${isDragging ? styles.dragActive : ""}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById("fileInput").click()}
            >
              <UploadIcon />
              <p>גרור לכאן קבצים או לחץ לבחירת קובץ</p>
              <p className={styles.hint}>
                ניתן להעלות עד 5 קבצים | JPG, PNG, PDF או DOC
              </p>
              <input
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                multiple
                accept="image/*,application/pdf,.doc,.docx"
                hidden
              />
            </div>
          )}
          
          {files.length > 0 && (
            <div className={styles.filePreview}>
              {files.map((file, index) => (
                <div key={index} className={styles.fileItem}>
                  <span className={styles.fileName}>{file.name}</span>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeFile(index)}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Form fields */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            שם המסמך
          </label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="שם המסמך (לא חובה)"
            className={styles.input}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            קטגוריה
          </label>
          <select
            value={docCategory}
            onChange={(e) => setDocCategory(e.target.value)}
            className={styles.select}
          >
            <option value="">בחר קטגוריה</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>
            הערות
          </label>
          <textarea
            value={docNote}
            onChange={(e) => setDocNote(e.target.value)}
            placeholder="הערות נוספות (לא חובה)"
            className={styles.textarea}
          />
        </div>
        
        {/* Buttons */}
        <div className={styles.actionButtons}>
          <button
            type="button"
            onClick={onClose}
            className={`${styles.button} ${styles.secondary}`}
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={loading || files.length === 0}
            className={`${styles.button} ${styles.primary}`}
          >
            {loading ? (
              <>
                <Spinner size={20} color="white" />
                <span>מעלה...</span>
              </>
            ) : (
              <span>שמור</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 