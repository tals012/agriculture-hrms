"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import Spinner from "@/components/spinner";
import Modal from "@/components/modal";
import UploadDocModal from "./uploadDocModal";
import styles from "@/styles/bigModals/worker/tabs/documents.module.scss";
import { 
  getWorkerDocuments, 
  deleteDocument, 
  updateDocument,
  getWorkerDocumentCategories
} from "@/app/(backend)/actions/workers/document";
import { sendForRemoteSignature } from "@/app/(backend)/actions/workers/document/sendForRemoteSignature";
import { sendBulkRemoteSignature } from "@/app/(backend)/actions/workers/document/sendBulkRemoteSignature";
import { getWorkerDetails } from "@/app/(backend)/actions/workers/getWorkerDetails";

const CheckIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path
      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
      fill="currentColor"
    />
  </svg>
);

const LinkIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path
      d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
      fill="currentColor"
    />
  </svg>
);

const SmsIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path
      d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
      fill="currentColor"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path
      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      fill="currentColor"
    />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path
      d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
      fill="currentColor"
    />
  </svg>
);

// Add a search icon component
const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.searchIcon}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// Add a signature icon
const SignatureIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path
      d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7zM7 9H4V5h3v4zm10 6h3v4h-3v-4zm0-10h3v4h-3V5z"
      fill="currentColor"
    />
  </svg>
);

const DocumentsTable = ({
  workerId,
  showUploadDocModal,
  onChangeUploadModalState,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [workerPhone, setWorkerPhone] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSendSignatureModal, setShowSendSignatureModal] = useState(false);
  const [currentDocForSignature, setCurrentDocForSignature] = useState(null);
  const [isSendingSignature, setIsSendingSignature] = useState(false);
  const [customPhone, setCustomPhone] = useState("");
  const [showBulkSignatureModal, setShowBulkSignatureModal] = useState(false);
  const [signatureMessage, setSignatureMessage] = useState("");

  console.log(workerId, "workerId")

  // Fetch worker documents
  useEffect(() => {
    const fetchWorkerDocuments = async () => {
      if (!workerId) return;
      
      try {
        setLoadingTemplates(true);
        
        const response = await getWorkerDocuments({ workerId });

        console.log(response, "response")
        
        if (response.ok) {
          setData(response.data);
        } else {
          toast.error(response.message || "שגיאה בטעינת המסמכים");
        }
      } catch (e) {
        console.error("Error fetching documents:", e);
        toast.error("שגיאה בטעינת המסמכים");
      } finally {
        setLoadingTemplates(false);
      }
    };

    // Fetch worker phone
    const fetchWorkerPhone = async () => {
      try {
        // Get worker details using server action
        const result = await getWorkerDetails({ workerId });
        
        if (result.ok && result.data && result.data.phone) {
          setWorkerPhone(result.data.phone);
        }
      } catch (error) {
        console.error("Error fetching worker phone:", error);
      }
    };

    // Fetch categories
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        
        const response = await getWorkerDocumentCategories();
        
        if (response.ok && response.data) {
          setCategories(response.data);
        } else {
          toast.error(response.message || "שגיאה בטעינת הקטגוריות");
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

    if (workerId) {
      fetchWorkerDocuments();
      fetchWorkerPhone();
      fetchCategories();
    }
  }, [workerId]);

  // Send document via SMS
  const sendDocumentLinkViaSMS = async (phone, documentLink, documentName) => {
    try {
      if (!phone) {
        toast.error("מספר טלפון לא תקין");
        return;
      }
      setLoading(true);
      
      // This would be replaced with your actual API call
      // Simulate API call success
      setTimeout(() => {
        toast.success("המסמך נשלח בהצלחה");
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("שגיאה בשליחת הודעה");
      setLoading(false);
    }
  };

  // Group documents by category
  const documentsByCategory = data.reduce((acc, doc) => {
    const categoryId = doc.simpleCategoryId || "uncategorized";
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(doc);
    return acc;
  }, {});

  // Get documents for active tab with search filtering
  const getActiveDocuments = () => {
    let filteredDocs =
      activeTab === "all" ? data : documentsByCategory[activeTab] || [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredDocs = filteredDocs.filter((doc) => {
        const dateStr = dayjs(doc.createdAt).format("DD/MM/YYYY");
        const nameMatch = doc.name?.toLowerCase().includes(query);
        const noteMatch = doc.note?.toLowerCase().includes(query);
        const dateMatch = dateStr.includes(query);
        return nameMatch || noteMatch || dateMatch;
      });
    }

    return filteredDocs;
  };

  // Add click outside listener to close the menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDocs(getActiveDocuments().map((doc) => doc.id));
    } else {
      setSelectedDocs([]);
    }
  };

  const handleSelectDoc = (docId) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter((id) => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  // Update the delete document function to use our server action
  const handleDeleteDoc = (document) => {
    setDocumentToDelete(document);
    setShowConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      setLoading(true);
      
      const result = await deleteDocument({ documentId: documentToDelete.id });
      
      if (result.ok) {
        // Remove the document from the state
        setData((prev) => prev.filter((doc) => doc.id !== documentToDelete.id));
        
        // Clear the selection if the document was selected
        if (selectedDocs.includes(documentToDelete.id)) {
          setSelectedDocs((prev) => prev.filter((id) => id !== documentToDelete.id));
        }
        
        toast.success(`המסמך "${documentToDelete.name}" נמחק בהצלחה`);
      } else {
        toast.error(result.message || "שגיאה במחיקת המסמך");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("שגיאה במחיקת המסמך");
    } finally {
      setLoading(false);
      setShowConfirmation(false);
      setDocumentToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.length === 0) return;
    
    const confirmBulkDelete = window.confirm(
      `האם אתה בטוח שברצונך למחוק ${selectedDocs.length} מסמכים?`
    );
    
    if (!confirmBulkDelete) return;
    
    try {
      setLoading(true);
      
      // Delete documents one by one
      const deletePromises = selectedDocs.map(docId => 
        deleteDocument({ documentId: docId })
      );
      
      const results = await Promise.all(deletePromises);
      const successfulDeletes = results.filter(result => result.ok);
      
      // Update the UI to remove the deleted documents
      if (successfulDeletes.length > 0) {
        setData(prev => prev.filter(doc => !selectedDocs.includes(doc.id)));
        toast.success(`${successfulDeletes.length} מסמכים נמחקו בהצלחה`);
        setSelectedDocs([]);
      }
      
      // Show error if some deletes failed
      if (successfulDeletes.length < selectedDocs.length) {
        toast.error(`${selectedDocs.length - successfulDeletes.length} מסמכים לא נמחקו`);
      }
    } catch (error) {
      console.error("Error bulk deleting documents:", error);
      toast.error("שגיאה במחיקת המסמכים");
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = (document) => {
    if (!workerPhone) {
      toast.error("לא נמצא מספר טלפון לעובד");
      return;
    }
    
    if (!document.link) {
      toast.error("לא נמצא קישור למסמך");
      return;
    }
    
    sendDocumentLinkViaSMS(workerPhone, document.link, document.name);
  };

  // Add a function to update document category
  const updateDocumentCategory = async (documentId, categoryId) => {
    try {
      setLoading(true);
      
      const result = await updateDocument({
        id: documentId,
        categoryId
      });
      
      if (result.ok) {
        // Update the document in the state
        setData(prev => prev.map(doc => 
          doc.id === documentId ? 
          { ...doc, 
            simpleCategoryId: categoryId, 
            category: categories.find(c => c.id === categoryId)?.name || "-" 
          } : doc
        ));
        
        toast.success("קטגוריית המסמך עודכנה בהצלחה");
      } else {
        toast.error(result.message || "שגיאה בעדכון קטגוריית המסמך");
      }
    } catch (error) {
      console.error("Error updating document category:", error);
      toast.error("שגיאה בעדכון קטגוריית המסמך");
    } finally {
      setLoading(false);
    }
  };

  // New function to handle single document signature request
  const handleSendForSignature = (document) => {
    setCurrentDocForSignature(document);
    setShowSendSignatureModal(true);
  };
  
  // Function to send a document for signature
  const confirmSendForSignature = async () => {
    if (!currentDocForSignature) return;
    
    const phone = customPhone || workerPhone;
    if (!phone) {
      toast.error("No phone number provided");
      return;
    }
    
    try {
      setIsSendingSignature(true);
      
      const result = await sendForRemoteSignature({
        documentId: currentDocForSignature.id,
        phone,
        message: signatureMessage || undefined,
      });
      
      if (result.ok) {
        toast.success(result.message || "Document sent for signature");
        fetchWorkerDocuments(); // Refresh the document list
      } else {
        toast.error(result.message || "Failed to send document for signature");
      }
    } catch (error) {
      console.error("Error sending document for signature:", error);
      toast.error("An error occurred while sending document for signature");
    } finally {
      setIsSendingSignature(false);
      setShowSendSignatureModal(false);
      setCurrentDocForSignature(null);
      setCustomPhone("");
      setSignatureMessage("");
    }
  };
  
  // Function to handle bulk signature sending
  const handleBulkSendForSignature = () => {
    if (selectedDocs.length === 0) {
      toast.warning("No documents selected");
      return;
    }
    
    setShowBulkSignatureModal(true);
  };
  
  // Function to execute bulk document sending
  const confirmBulkSendForSignature = async () => {
    if (selectedDocs.length === 0) return;
    
    const phone = customPhone || workerPhone;
    if (!phone) {
      toast.error("No phone number provided");
      return;
    }
    
    try {
      setIsSendingSignature(true);
      
      const result = await sendBulkRemoteSignature({
        documentIds: selectedDocs,
        phone,
        message: signatureMessage || undefined,
      });
      
      if (result.ok) {
        toast.success(result.message || "Documents sent for signature");
        fetchWorkerDocuments(); // Refresh the document list
        setSelectedDocs([]); // Clear selection
      } else {
        toast.error(result.message || "Failed to send documents for signature");
      }
    } catch (error) {
      console.error("Error sending documents for signature:", error);
      toast.error("An error occurred while sending documents for signature");
    } finally {
      setIsSendingSignature(false);
      setShowBulkSignatureModal(false);
      setCustomPhone("");
      setSignatureMessage("");
    }
  };

  if (loadingTemplates) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size={40} />
        <p className="mt-4 text-lg font-medium text-gray-600">טוען מסמכים...</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      {/* Category Tabs */}
      <div className={styles.categoryTabs}>
        <button
          className={`${styles.tab} ${activeTab === "all" ? styles.active : ""}`}
          onClick={() => setActiveTab("all")}
        >
          כל המסמכים
          <span>({data.length})</span>
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`${styles.tab} ${activeTab === category.id ? styles.active : ""}`}
            onClick={() => setActiveTab(category.id)}
          >
            {category.name}
            <span>({(documentsByCategory[category.id] || []).length})</span>
          </button>
        ))}
        <button
          className={`${styles.tab} ${activeTab === "uncategorized" ? styles.active : ""}`}
          onClick={() => setActiveTab("uncategorized")}
        >
          לא מסווג
          <span>({(documentsByCategory["uncategorized"] || []).length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="חיפוש לפי שם, הערה או תאריך..."
        />
        <SearchIcon />
      </div>

      {/* Bulk Actions */}
      {selectedDocs.length > 0 && (
        <div className={styles.bulkActions}>
          <span>
            {selectedDocs.length} מסמכים נבחרו
          </span>
          <button onClick={handleBulkDelete}>
            <DeleteIcon />
            <span>מחק נבחרים</span>
          </button>
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={
                  selectedDocs.length === getActiveDocuments().length &&
                  getActiveDocuments().length > 0
                }
              />
            </th>
            <th>תאריך יצירה</th>
            <th>שם המסמך</th>
            <th>קטגוריה</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {getActiveDocuments().length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: "20px 0" }}>
                {loading ? "טוען..." : "לא נמצאו מסמכים"}
              </td>
            </tr>
          ) : (
            getActiveDocuments().map((row, idx) => (
              <tr key={idx.toString()}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(row.id)}
                    onChange={() => handleSelectDoc(row.id)}
                  />
                </td>
                <td>
                  {dayjs(row.createdAt).format("DD/MM/YYYY | HH:mm")}
                </td>
                <td>
                  <p>{row.name || "-"}</p>
                  {row.note && (
                    <span className={styles.key}>{row.note}</span>
                  )}
                </td>
                <td>
                  <div className={styles.categoryPill}>
                    {row.category || "לא מסווג"}
                  </div>
                </td>
                <td>
                  <div className={styles.actionsContainer}>
                    <button
                      onClick={() => window.open(row.link, "_blank")}
                      className={styles.iconButton}
                      title="צפה במסמך"
                    >
                      <LinkIcon />
                    </button>
                    <button
                      onClick={() => handleSendSMS(row)}
                      className={styles.iconButton}
                      title="שלח בSMS"
                    >
                      <SmsIcon />
                    </button>
                    <button
                      onClick={() => setActiveMenu(row.id)}
                      className={styles.iconButton}
                      title="עוד פעולות"
                    >
                      <MenuIcon />
                    </button>
                  </div>

                  {activeMenu === row.id && (
                    <div
                      ref={menuRef}
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: "50%",
                        transform: "translateX(50%)",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                        zIndex: 10,
                        minWidth: "180px",
                        padding: "8px 0"
                      }}
                    >
                      <div
                        onClick={() => {
                          handleDeleteDoc(row);
                          setActiveMenu(null);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 16px",
                          cursor: "pointer",
                          color: "#ef4444"
                        }}
                      >
                        <DeleteIcon />
                        <span>מחק מסמך</span>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Upload Document Modal */}
      {showUploadDocModal && (
        <Modal 
          isOpen={showUploadDocModal} 
          onClose={() => onChangeUploadModalState(false)}
          title="העלאת מסמך חדש"
        >
          <UploadDocModal
            workerId={workerId}
            onRefresh={() => {
              onChangeUploadModalState(false);
              // Refresh documents after upload
              // This would be replaced with your actual refresh function
            }}
          />
        </Modal>
      )}

      {showConfirmation && (
        <Modal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          title="מחיקת מסמך"
        >
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p style={{ marginBottom: "20px" }}>
              האם אתה בטוח שברצונך למחוק את המסמך{" "}
              <strong>{documentToDelete?.name}</strong>?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
              <button
                onClick={() => setShowConfirmation(false)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  backgroundColor: "white"
                }}
              >
                ביטול
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                מחק
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Send for Signature Modal */}
      <Modal
        isOpen={showSendSignatureModal}
        onClose={() => setShowSendSignatureModal(false)}
        title="שלח מסמך לחתימה דיגיטלית"
      >
        <div className={styles.signatureModal}>
          <p>
            שליחת המסמך "{currentDocForSignature?.name}" לחתימה דיגיטלית.
          </p>
          
          <div className={styles.phoneSelection}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                checked={!customPhone}
                onChange={() => setCustomPhone("")}
              />
              שלח למספר טלפון של העובד: {workerPhone || "לא נמצא"}
            </label>
            
            <label className={styles.radioLabel}>
              <input
                type="radio"
                checked={!!customPhone}
                onChange={() => setCustomPhone(workerPhone || "")}
              />
              שלח למספר טלפון אחר:
            </label>
            
            {!!customPhone && (
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="הכנס מספר טלפון"
                className={styles.phoneInput}
              />
            )}
          </div>
          
          <div className={styles.messageInput}>
            <label>הודעה מותאמת אישית (אופציונלי):</label>
            <textarea
              value={signatureMessage}
              onChange={(e) => setSignatureMessage(e.target.value)}
              placeholder="הכנס הודעה מותאמת אישית..."
              rows={3}
              className={styles.textarea}
            />
          </div>
          
          <div className={styles.modalActions}>
            <button
              onClick={() => setShowSendSignatureModal(false)}
              className={styles.cancelButton}
              disabled={isSendingSignature}
            >
              ביטול
            </button>
            <button
              onClick={confirmSendForSignature}
              className={styles.confirmButton}
              disabled={isSendingSignature || (!workerPhone && !customPhone)}
            >
              {isSendingSignature ? <Spinner size="small" /> : "שלח"}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Add Bulk Send for Signature Modal */}
      <Modal
        isOpen={showBulkSignatureModal}
        onClose={() => setShowBulkSignatureModal(false)}
        title="שלח מסמכים לחתימה דיגיטלית"
      >
        <div className={styles.signatureModal}>
          <p>
            שליחת {selectedDocs.length} מסמכים לחתימה דיגיטלית.
          </p>
          
          <div className={styles.phoneSelection}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                checked={!customPhone}
                onChange={() => setCustomPhone("")}
              />
              שלח למספר טלפון של העובד: {workerPhone || "לא נמצא"}
            </label>
            
            <label className={styles.radioLabel}>
              <input
                type="radio"
                checked={!!customPhone}
                onChange={() => setCustomPhone(workerPhone || "")}
              />
              שלח למספר טלפון אחר:
            </label>
            
            {!!customPhone && (
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="הכנס מספר טלפון"
                className={styles.phoneInput}
              />
            )}
          </div>
          
          <div className={styles.messageInput}>
            <label>הודעה מותאמת אישית (אופציונלי):</label>
            <textarea
              value={signatureMessage}
              onChange={(e) => setSignatureMessage(e.target.value)}
              placeholder="הכנס הודעה מותאמת אישית..."
              rows={3}
              className={styles.textarea}
            />
          </div>
          
          <div className={styles.modalActions}>
            <button
              onClick={() => setShowBulkSignatureModal(false)}
              className={styles.cancelButton}
              disabled={isSendingSignature}
            >
              ביטול
            </button>
            <button
              onClick={confirmBulkSendForSignature}
              className={styles.confirmButton}
              disabled={isSendingSignature || (!workerPhone && !customPhone)}
            >
              {isSendingSignature ? <Spinner size="small" /> : "שלח"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsTable;
