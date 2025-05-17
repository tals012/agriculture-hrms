"use client";

import TextField from "@/components/textField";
import DateField from "@/components/dateField";
import ReactSelect from "react-select";
import styles from "@/styles/containers/bigModals/worker/general/tabs/tabs.module.scss";

const selectStyle = {
  control: (baseStyles) => ({
    ...baseStyles,
    width: "100%",
    border: "1px solid #E6E6E6",
    height: "44px",
    fontSize: "14px",
    color: "#999FA5",
    borderRadius: "6px",
    background: "transparent",
    zIndex: 999999,
  }),
  menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
  menu: (provided) => ({ ...provided, zIndex: 9999 }),
};

const PersonalTab = ({ personalData, setPersonalData }) => {
  const handleChange = (e, key) => {
    if (
      key === "birthday" ||
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
            label="שם פרטי"
            width="100%"
            value={personalData.name || ""}
            onChange={(e) => handleChange(e, "name")}
          />
        </div>
        <div className={styles.formField}>
          <TextField
            label="שם משפחה"
            width="100%"
            value={personalData.surname || ""}
            onChange={(e) => handleChange(e, "surname")}
          />
        </div>
        <div className={styles.formField}>
          <ReactSelect
            options={[
              { value: "MALE", label: "זכר" },
              { value: "FEMALE", label: "נקבה" },
            ]}
            components={{
              IndicatorSeparator: () => null,
            }}
            placeholder="מין"
            value={
              personalData.sex
                ? {
                    value: personalData.sex,
                    label: personalData.sex === "MALE" ? "זכר" : "נקבה",
                  }
                : null
            }
            onChange={(option) =>
              setPersonalData({
                ...personalData,
                sex: option ? option.value : null,
              })
            }
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
            styles={selectStyle}
          />
        </div>
        <div className={styles.formField}>
          <DateField
            label="תאריך לידה"
            width="100%"
            value={personalData.birthday}
            onChange={(e) => handleChange(e, "birthday")}
          />
        </div>
        <div className={styles.formField}>
          <TextField
            label="טלפון ראשי"
            width="100%"
            value={personalData.primaryPhone || ""}
            onChange={(e) => handleChange(e, "primaryPhone")}
          />
        </div>
        <div className={styles.formField}>
          <TextField
            label="טלפון משני"
            width="100%"
            value={personalData.secondaryPhone || ""}
            onChange={(e) => handleChange(e, "secondaryPhone")}
          />
        </div>
        <div className={styles.formField}>
          <TextField
            label="אימייל"
            width="100%"
            value={personalData.email || ""}
            onChange={(e) => handleChange(e, "email")}
          />
        </div>

        {/* Passport Details Section */}
        <div className={styles.sectionHeading}>
          <h3>פרטי דרכון</h3>
        </div>

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

export default PersonalTab;
