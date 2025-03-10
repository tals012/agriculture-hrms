"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import Button from "@/components/button";
import { toast } from "react-toastify";
import styles from "@/styles/containers/screens/workers/bulkUpload.module.scss";
import Input from "@/components/input";
import { createSignedUploadURLs } from "@/app/actions/assets/createSignedUrls";
import { uploadDocument } from "@/app/actions/fieldman/digitalForms/uploadDocument";
import { revalidateCustomPath } from "@/app/actions/utils";
import getUserProfile from "@/app/actions/profile/getUserProfile";
import Spinner from "@/components/spinner";
import { getWorkerSimpleCategories } from "@/app/actions/categories/worker/getWorkerSimpleCategories";

const UploadIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
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
  >
    <circle cx="12" cy="12" r="8" fill="white" />
    <circle cx="12" cy="12" r="6" fill="currentColor" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
  </svg>
);

export default function UploadDocModal({ workerId, onRefresh }) {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [fields, setFields] = useState({
    name: "",
    note: "",
    simpleCategoryId: "",
  });
  const [isDragging, setIsDragging] = useState(false);

  const router = useRouter();

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    addFiles(newFiles);
  };

  const addFiles = (newFiles) => {
    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles];
      newFiles.forEach((file) => {
        if (updatedFiles.length < 5) {
          updatedFiles.push(file);
        }
      });
      return updatedFiles.slice(0, 5);
    });
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera if available
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("לא ניתן לגשת למצלמה", {
        position: "top-center",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert the canvas to a file
      canvas.toBlob((blob) => {
        const file = new File([blob], "camera-capture.jpg", {
          type: "image/jpeg",
        });
        setFiles([file]);
        stopCamera();
        setIsCameraMode(false);
      }, "image/jpeg");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await getUserProfile();
      setUserId(res.data.id);

      // Fetch categories
      const categoriesRes = await getWorkerSimpleCategories();
      if (categoriesRes.ok) {
        setCategories(categoriesRes.data);
      } else {
        toast.error("שגיאה בטעינת הקטגוריות", {
          position: "top-center",
        });
      }
    };
    fetchData();

    // Cleanup camera on unmount
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isCameraMode) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraMode]);

  const onSave = React.useCallback(
    async (e) => {
      e.preventDefault();
      if (files.length === 0) {
        toast.error("נא לבחור קובץ או לצלם תמונה", {
          position: "top-center",
        });
        return;
      }

      try {
        setIsLoading(true);
        const note = fields.note;
        const simpleCategoryId = fields.simpleCategoryId;

        // Create an array of file extensions for the upload URLs
        const fileRequests = files.map((file) => ({
          ext: `.${file.name.split(".").pop()}`,
          type: "UNKNOWN",
        }));

        const singedUploadUrlRes = await createSignedUploadURLs({
          files: fileRequests,
        });

        if (singedUploadUrlRes.ok) {
          // Upload all files in parallel
          const uploadPromises = files.map((file, index) => {
            const singedUploadUrl =
              singedUploadUrlRes.data[index].assetStorageFileUploadURL;
            return fetch(singedUploadUrl, {
              method: "PUT",
              body: file,
            });
          });

          const uploadResults = await Promise.all(uploadPromises);

          if (uploadResults.every((res) => res.ok)) {
            // Upload documents metadata in parallel
            const docPromises = singedUploadUrlRes.data.map((data, index) => {
              return uploadDocument({
                foreignWorkerId: workerId,
                documentAssetId: data.assetId,
                documentType: "UPLOADED",
                name:
                  files.length === 1 && fields.name
                    ? fields.name
                    : files[index].name,
                note: note || "",
                userId,
                simpleCategoryId,
              });
            });

            const docResults = await Promise.all(docPromises);

            if (docResults.every((res) => res?.ok)) {
              setFields({
                name: "",
                note: "",
                simpleCategoryId: "",
              });
              setFiles([]);
              toast.success("הקבצים עלו בהצלחה", {
                position: "top-center",
              });
              onRefresh();
            } else {
              toast.error("חלק מהמסמכים לא עלו", {
                position: "top-center",
              });
            }
          } else {
            toast.error("שגיאה בהעלאת הקבצים", {
              position: "top-center",
            });
          }
        }
      } catch (e) {
        console.log(e);
        toast.error("לא ניתן לשמור את הקבצים", {
          position: "top-center",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [files, workerId, onRefresh, fields, userId]
  );

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

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    const isImageOrPdf = ["jpg", "jpeg", "png", "gif", "pdf"].includes(
      extension
    );

    return isImageOrPdf ? (
      <Image
        src="/assets/icons/file-icon.svg"
        alt="file-icon"
        width={24}
        height={24}
      />
    ) : (
      <DownloadIcon />
    );
  };

  return (
    <div className={styles.container}>
      <form onSubmit={onSave}>
        <h2
          className={styles.heading}
          style={{
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "600",
            color: "#2d3748",
            marginBottom: "1.5rem",
          }}
        >
          הוספת מסמך חדש
        </h2>

        <div className="form-fields" style={{ marginBottom: "2rem" }}>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <Input
              label="שם המסמך (אופציונלי)"
              width="100%"
              value={fields.name}
              onChange={(e) => {
                setFields({ ...fields, name: e.target.value });
              }}
              required={false}
              name={"name"}
              style={{
                backgroundColor: "#f7fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "0.375rem",
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label
              className={styles.label}
              style={{
                display: "block",
                marginBottom: "0.5rem",
                color: "#4a5568",
              }}
            >
              קטגוריה פשוטה
            </label>
            <select
              className={styles.select}
              value={fields.simpleCategoryId}
              onChange={(e) => {
                setFields({ ...fields, simpleCategoryId: e.target.value });
              }}
              name="simpleCategoryId"
              required={true}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.375rem",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f7fafc",
                color: "#4a5568",
                outline: "none",
                transition: "all 0.3s ease",
              }}
            >
              <option value="">בחר קטגוריה</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <Input
              label="הערות למסמך"
              width="100%"
              value={fields.note}
              onChange={(e) => {
                setFields({ ...fields, note: e.target.value });
              }}
              name={"note"}
              style={{
                backgroundColor: "#f7fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "0.375rem",
              }}
            />
          </div>
        </div>

        <div
          className={styles.imageUpload}
          style={{
            backgroundColor: "#f7fafc",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            className={styles.uploadOptions}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <button
              type="button"
              onClick={() => setIsCameraMode(false)}
              style={{
                backgroundColor: !isCameraMode ? "#4299e1" : "#e2e8f0",
                color: !isCameraMode ? "white" : "#4a5568",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.375rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s ease",
              }}
            >
              <UploadIcon />
              העלאת קובץ
            </button>
            <button
              type="button"
              onClick={() => setIsCameraMode(true)}
              style={{
                backgroundColor: isCameraMode ? "#4299e1" : "#e2e8f0",
                color: isCameraMode ? "white" : "#4a5568",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.375rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s ease",
              }}
            >
              <CameraIcon />
              צילום
            </button>
          </div>

          {isCameraMode ? (
            <div
              className={styles.cameraContainer}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "500px",
                margin: "0 auto",
                borderRadius: "0.5rem",
                overflow: "hidden",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: "100%", borderRadius: "0.5rem" }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <button
                type="button"
                onClick={takePhoto}
                style={{
                  position: "absolute",
                  bottom: "1rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#e53e3e",
                  color: "white",
                  border: "none",
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                <CaptureIcon />
              </button>
            </div>
          ) : (
            <div
              className={styles.uploadBox}
              style={{
                border: `2px dashed ${isDragging ? "#4299e1" : "#cbd5e0"}`,
                borderRadius: "0.5rem",
                padding: "2rem",
                textAlign: "center",
                backgroundColor: isDragging ? "#ebf8ff" : "white",
                position: "relative",
                minHeight: "200px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {files.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    width: "100%",
                    maxWidth: "400px",
                  }}
                >
                  {files.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem",
                        backgroundColor: "#f7fafc",
                        borderRadius: "0.375rem",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {getFileIcon(file.name)}
                        <span style={{ color: "#4a5568" }}>{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          color: "#e53e3e",
                          cursor: "pointer",
                          padding: "0.25rem",
                          borderRadius: "0.25rem",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  ))}
                  {files.length < 5 && (
                    <label
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        padding: "0.5rem",
                        backgroundColor: "#edf2f7",
                        borderRadius: "0.375rem",
                        color: "#4a5568",
                      }}
                    >
                      <UploadIcon />
                      <span>הוסף קובץ נוסף ({5 - files.length} נותרו)</span>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*,application/pdf,.doc,.docx"
                        style={{ display: "none" }}
                        multiple
                      />
                    </label>
                  )}
                </div>
              ) : (
                <label
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <UploadIcon />
                  <p style={{ margin: "1rem 0", color: "#4a5568" }}>
                    העלאת מסמכים
                  </p>
                  <small style={{ color: "#718096" }}>
                    ניתן להעלות עד 5 קבצים | 4MB לקובץ | JPG, PNG, PDF or DOC
                  </small>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,application/pdf,.doc,.docx"
                    style={{ display: "none" }}
                    multiple
                  />
                </label>
              )}
            </div>
          )}

          {files.length > 0 && !isCameraMode && (
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setFiles([])}
                style={{
                  backgroundColor: "#e53e3e",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  margin: "0 auto",
                }}
              >
                <DeleteIcon />
                מחק את כל הקבצים
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <Button
            w={200}
            h={48}
            type="submit"
            disabled={!files.length || isLoading}
            style={{
              backgroundColor:
                !files.length || isLoading ? "#cbd5e0" : "#4299e1",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: !files.length || isLoading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {isLoading ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Spinner />
                <span>מעלה...</span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  justifyContent: "center",
                }}
              >
                <UploadIcon />
                <span>לשמור שינויים</span>
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
