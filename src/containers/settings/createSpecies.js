"use client";

import styles from "@/styles/containers/settings/createSpecies.module.scss";
import { IoClose } from "react-icons/io5";
import { useState, useEffect } from "react";

const CreateSpecies = ({ onClose, onSubmit, isEdit = false, initialData = null }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isEdit && initialData) {
      setName(initialData.name);
    }
  }, [isEdit, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{isEdit ? "עריכת מין" : "הוספת מין חדש"}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
            <div className={styles.field}>
              <label>שם המין</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="הכנס שם..."
                required
                autoFocus
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              ביטול
            </button>
            <button type="submit" className={styles.submitButton}>
              {isEdit ? "שמור שינויים" : "הוסף מין"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSpecies;
