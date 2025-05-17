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
    if (key === "birthday") {
      return setPersonalData({ ...personalData, [key]: e });
    }
    setPersonalData({ ...personalData, [key]: e.target.value });
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.formFields}>
        <div className={styles.formField}>
          <TextField
            label="שם פרטי בעברית"
            width="100%"
            value={personalData.nameHe || ""}
            onChange={(e) => handleChange(e, "nameHe")}
          />
        </div>
        <div className={styles.formField}>
          <TextField
            label="שם משפחה בעברית"
            width="100%"
            value={personalData.surnameHe || ""}
            onChange={(e) => handleChange(e, "surnameHe")}
          />
        </div>
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
      </div>
    </div>
  );
};

export default PersonalTab;
