"use client";

import { useState } from "react";
import TextField from "@/components/textField";
import ReactSelect from "react-select";
import styles from "@/styles/containers/bigModals/worker/general/tabs/tabs.module.scss";
import BankBranchPopup from "@/components/bankBranchPopup";
import addBank from "@/app/(backend)/actions/bank/addBank";
import addBranch from "@/app/(backend)/actions/branch/addBranch";
import { message } from "antd";

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
  const [showBankPopup, setShowBankPopup] = useState(false);
  const [showBranchPopup, setShowBranchPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e, key) => {
    setPersonalData({ ...personalData, [key]: e.target.value });
  };

  const handleAddBank = async (bankData) => {
    try {
      setIsLoading(true);
      const result = await addBank(bankData);

      if (result.status === 200) {
        message.success({
          content: result.message,
          duration: 4,
          style: { marginTop: "20px" },
        });
        // Refresh the page to load updated banks
        window.location.reload();
      } else {
        message.error({
          content: result.message,
          duration: 4,
          style: { marginTop: "20px" },
        });
      }
    } catch (error) {
      console.error("Error adding bank:", error);
      message.error({
        content: "שגיאה בהוספת בנק חדש",
        duration: 4,
        style: { marginTop: "20px" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBranch = async (branchData) => {
    try {
      setIsLoading(true);
      const result = await addBranch(branchData);

      if (result.status === 200) {
        message.success({
          content: result.message,
          duration: 4,
          style: { marginTop: "20px" },
        });
        // Refresh the page to load updated branches
        window.location.reload();
      } else {
        message.error({
          content: result.message,
          duration: 4,
          style: { marginTop: "20px" },
        });
      }
    } catch (error) {
      console.error("Error adding branch:", error);
      message.error({
        content: "שגיאה בהוספת סניף חדש",
        duration: 4,
        style: { marginTop: "20px" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.formFields}>
        <div className={styles.formField}>
          {banks && (
            <>
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
              <button
                type="button"
                className={styles.addNewButton}
                onClick={() => setShowBankPopup(true)}
                disabled={isLoading}
              >
                + הוספת בנק חדש
              </button>
            </>
          )}
        </div>
        <div className={styles.formField}>
          {branches && (
            <>
              <ReactSelect
                options={branches.map((branch) => ({
                  value: branch.id,
                  label: branch.branchId || "",
                }))}
                components={{
                  IndicatorSeparator: () => null,
                }}
                placeholder="סניף"
                value={
                  personalData.branchId
                    ? {
                        value: personalData.branchId,
                        label:
                          branches.find((b) => b.id === personalData.branchId)
                            ?.branchId || "",
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
              <button
                type="button"
                className={styles.addNewButton}
                onClick={() => {
                  setShowBranchPopup(true);
                }}
                disabled={isLoading}
              >
                + הוספת סניף חדש
              </button>
            </>
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

      {showBankPopup && (
        <BankBranchPopup
          type="bank"
          onClose={() => setShowBankPopup(false)}
          onSubmit={handleAddBank}
        />
      )}

      {showBranchPopup && (
        <BankBranchPopup
          type="branch"
          onClose={() => setShowBranchPopup(false)}
          onSubmit={handleAddBranch}
          selectedBankId={personalData.bankId}
        />
      )}
    </div>
  );
};

export default BankTab;
