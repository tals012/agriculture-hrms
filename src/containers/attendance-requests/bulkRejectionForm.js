"use client";
import { useState } from "react";
import { FaTimes } from "react-icons/fa";
import styles from "@/styles/containers/attendance-requests/bulk-rejection-form.module.scss";

/**
 * Form component for bulk rejection of attendance requests
 * 
 * @param {Object} props Component props
 * @param {string} props.groupId - ID of the group whose requests are being rejected
 * @param {string} props.groupName - Name of the group for display purposes
 * @param {Function} props.onSubmit - Function to call on form submission with (groupId, reason)
 * @param {Function} props.onCancel - Function to call when canceling
 */
const BulkRejectionForm = ({ groupId, groupName, onSubmit, onCancel }) => {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate reason
    if (!reason.trim()) {
      setErrorMessage("יש להזין סיבה לדחיית הבקשות");
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      // Call the provided onSubmit handler with groupId and reason
      await onSubmit(groupId, reason.trim());
      
      // Form will be closed by parent component on successful submission
    } catch (error) {
      setErrorMessage("אירעה שגיאה בדחיית הבקשות. אנא נסה שנית.");
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>דחיית כל הבקשות של {groupName}</h3>
          <button 
            className={styles.closeButton} 
            onClick={onCancel}
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="rejectionReason" className={styles.label}>
              סיבת הדחייה:
            </label>
            <textarea
              id="rejectionReason"
              className={styles.textarea}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="הסבר מדוע כל הבקשות נדחות"
              rows={4}
              disabled={isLoading}
              required
            />
            {errorMessage && (
              <div className={styles.errorMessage}>{errorMessage}</div>
            )}
          </div>
          
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={isLoading}
            >
              ביטול
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "מעבד..." : "דחה את כל הבקשות"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkRejectionForm; 