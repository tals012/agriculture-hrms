"use client";

import { useState } from "react";
import styles from "@/styles/components/bankBranchPopup.module.scss";
import TextField from "./textField";

const BankBranchPopup = ({ type, onClose, onSubmit, selectedBankId }) => {
  const [formData, setFormData] = useState({
    bankId: "",
    branchId: "",
    hebrewName: "",
    englishName: "",
  });

  const handleChange = (e, field) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (type === "bank" && (!formData.bankId || !formData.hebrewName)) {
      return;
    }

    if (type === "branch" && (!formData.branchId || !formData.hebrewName)) {
      return;
    }

    // Add selected bank ID for branch creation if available
    const dataToSubmit =
      type === "branch" && selectedBankId
        ? { ...formData, bankId: selectedBankId }
        : formData;

    await onSubmit(dataToSubmit);
    onClose();
  };

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContainer}>
        <div className={styles.popupHeader}>
          <h3>{type === "bank" ? "הוספת בנק חדש" : "הוספת סניף חדש"}</h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.popupForm}>
          {type === "bank" ? (
            <>
              <TextField
                label="מספר בנק"
                width="100%"
                value={formData.bankId}
                onChange={(e) => handleChange(e, "bankId")}
                required
              />
              <TextField
                label="שם בנק בעברית"
                width="100%"
                value={formData.hebrewName}
                onChange={(e) => handleChange(e, "hebrewName")}
                required
              />
              <TextField
                label="שם בנק באנגלית (לא חובה)"
                width="100%"
                value={formData.englishName}
                onChange={(e) => handleChange(e, "englishName")}
              />
            </>
          ) : (
            <>
              <TextField
                label="מספר סניף"
                width="100%"
                value={formData.branchId}
                onChange={(e) => handleChange(e, "branchId")}
                required
              />
              <TextField
                label="שם סניף בעברית"
                width="100%"
                value={formData.hebrewName}
                onChange={(e) => handleChange(e, "hebrewName")}
                required
              />
            </>
          )}

          <div className={styles.popupFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              ביטול
            </button>
            <button type="submit" className={styles.submitButton}>
              {type === "bank" ? "הוסף בנק" : "הוסף סניף"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankBranchPopup;
