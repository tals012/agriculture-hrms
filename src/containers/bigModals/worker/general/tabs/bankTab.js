"use client";

import TextField from "@/components/textField";
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

const BankTab = ({ personalData, setPersonalData, banks, branches }) => {
  const handleChange = (e, key) => {
    setPersonalData({ ...personalData, [key]: e.target.value });
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.formFields}>
        <div className={styles.formField}>
          {banks && (
            <ReactSelect
              options={banks.map((bank) => ({
                value: bank.id,
                label: bank.hebrewName,
              }))}
              components={{
                IndicatorSeparator: () => null,
              }}
              placeholder="בנק"
              value={
                personalData.bankId
                  ? {
                      value: personalData.bankId,
                      label: banks.find((b) => b.id === personalData.bankId)
                        ?.hebrewName,
                    }
                  : null
              }
              onChange={(option) =>
                setPersonalData({
                  ...personalData,
                  bankId: option ? option.value : null,
                })
              }
              menuPortalTarget={document.body}
              menuPosition={"fixed"}
              styles={selectStyle}
              isClearable={true}
              isSearchable={true}
            />
          )}
        </div>
        <div className={styles.formField}>
          {branches && (
            <ReactSelect
              options={branches.map((branch) => ({
                value: branch.id,
                label: branch.hebrewName,
              }))}
              components={{
                IndicatorSeparator: () => null,
              }}
              placeholder="סניף"
              value={
                personalData.branchId
                  ? {
                      value: personalData.branchId,
                      label: branches.find(
                        (b) => b.id === personalData.branchId
                      )?.hebrewName,
                    }
                  : null
              }
              onChange={(option) =>
                setPersonalData({
                  ...personalData,
                  branchId: option ? option.value : null,
                })
              }
              menuPortalTarget={document.body}
              menuPosition={"fixed"}
              styles={selectStyle}
              isClearable={true}
              isSearchable={true}
            />
          )}
        </div>
        <div className={styles.formField}>
          <TextField
            label="מספר חשבון בנק"
            width="100%"
            value={personalData.bankAccountNumber || ""}
            onChange={(e) => handleChange(e, "bankAccountNumber")}
          />
        </div>
      </div>
    </div>
  );
};

export default BankTab;
