"use client";
import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import styles from "@/styles/screens/attendance-requests.module.scss";

export default function RejectionReasonForm({ requestId, onSubmit, onCancel }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the reason
    if (!reason.trim()) {
      setError("נא להזין סיבת דחייה");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await onSubmit(requestId, reason);
    } catch (error) {
      console.error("Error submitting rejection reason:", error);
      setError("אירעה שגיאה בעת שליחת סיבת הדחייה");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{ maxWidth: "500px" }}>
        <div className={styles.modalHeader}>
          <h3>סיבת דחייה</h3>
          <button className={styles.closeButton} onClick={onCancel}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <p className={styles.formDescription}>
              נא לציין את הסיבה לדחיית דיווח הנוכחות. הסיבה תוצג למנהל השדה שהגיש את הדיווח.
            </p>
            
            <div className={styles.formGroup}>
              <label htmlFor="rejectionReason" className={styles.formLabel}>
                סיבת דחייה
              </label>
              <textarea
                id="rejectionReason"
                className={styles.textArea}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="נא להזין את סיבת הדחייה..."
              />
              
              {error && <p className={styles.errorMessage}>{error}</p>}
            </div>
          </div>
          
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={loading}
            >
              ביטול
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "שולח..." : "שלח"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 