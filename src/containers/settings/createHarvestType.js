"use client";

import styles from "@/styles/containers/settings/createHarvestType.module.scss";
import { IoClose } from "react-icons/io5";
import { useState, useEffect } from "react";
import { createHarvestType } from "@/app/(backend)/actions/misc/harvestTypes/createHarvestType";
import { editHarvestType } from "@/app/(backend)/actions/misc/harvestTypes/editHarvestType";
import { toast } from "react-toastify";
import Spinner from "@/components/spinner";

const CreateHarvestType = ({ onClose, onSubmit, isEdit = false, initialData = null }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && initialData) {
      setName(initialData.name);
    }
  }, [isEdit, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = isEdit
        ? await editHarvestType({ id: initialData.id, name })
        : await createHarvestType({ name });

      if (response.error) {
        toast.error(response.error, {
          rtl: true,
        });
      } else {
        toast.success(isEdit ? "סוג הקטיף עודכן בהצלחה" : "סוג הקטיף נוצר בהצלחה", {
          rtl: true,
        });
        onSubmit(response.data);
      }
    } catch (error) {
      toast.error("אירעה שגיאה בלתי צפויה", {
        rtl: true,
      });
    }

    setLoading(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{isEdit ? "עריכת סוג קטיף" : "הוספת סוג קטיף חדש"}</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={loading}>
            <IoClose />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
            <div className={styles.field}>
              <label>שם סוג הקטיף</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="הכנס שם..."
                required
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button 
              type="button" 
              className={styles.cancelButton} 
              onClick={onClose}
              disabled={loading}
            >
              ביטול
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? <Spinner size={14} color="#fff" /> : isEdit ? "שמור שינויים" : "הוסף סוג קטיף"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHarvestType;
