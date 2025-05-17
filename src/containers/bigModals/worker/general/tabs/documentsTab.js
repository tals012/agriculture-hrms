"use client";

import TextField from "@/components/textField";
import DateField from "@/components/dateField";
import styles from "@/styles/containers/bigModals/worker/general/tabs/tabs.module.scss";

const DocumentsTab = ({ personalData, setPersonalData }) => {
  const handleChange = (e, key) => {
    if (
      key === "passportValidity" ||
      key === "visaValidity" ||
      key === "inscriptionDate" ||
      key === "entryDate"
    ) {
      return setPersonalData({ ...personalData, [key]: e });
    }
    setPersonalData({ ...personalData, [key]: e.target.value });
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.formFields}>
        <div className={styles.formField}>
          <TextField
            label="דרכון"
            width="100%"
            value={personalData.passport || ""}
            onChange={(e) => handleChange(e, "passport")}
          />
        </div>
        <div className={styles.formField}>
          <DateField
            label="תוקף דרכון"
            width="100%"
            value={personalData.passportValidity}
            onChange={(e) => handleChange(e, "passportValidity")}
          />
        </div>
        <div className={styles.formField}>
          <TextField
            label="ויזה"
            width="100%"
            value={personalData.visa || ""}
            onChange={(e) => handleChange(e, "visa")}
          />
        </div>
        <div className={styles.formField}>
          <DateField
            label="תוקף ויזה"
            width="100%"
            value={personalData.visaValidity}
            onChange={(e) => handleChange(e, "visaValidity")}
          />
        </div>
        <div className={styles.formField}>
          <DateField
            label="תאריך רישום"
            width="100%"
            value={personalData.inscriptionDate}
            onChange={(e) => handleChange(e, "inscriptionDate")}
          />
        </div>
        <div className={styles.formField}>
          <DateField
            label="תאריך כניסה"
            width="100%"
            value={personalData.entryDate}
            onChange={(e) => handleChange(e, "entryDate")}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab;
