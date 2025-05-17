"use client";

import { useState, useEffect } from "react";
import TextField from "@/components/textField";
import Spinner from "@/components/spinner";
import styles from "@/styles/bigModals/worker/tabs/credentials.module.scss";
import { updatePassword } from "@/app/(backend)/actions/workers/updatePassword";
import sendSMS from "@/app/(backend)/actions/sms/sendSMS";

const Credentials = ({ workerId, workerData }) => {
  console.log(workerData, "workerData");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", isError: false });
  const [hasUserAccount, setHasUserAccount] = useState(false);
  const [sendCredentialsViaSMS, setSendCredentialsViaSMS] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Use workerData passed from parent component
  useEffect(() => {
    // Reset form when workerId changes
    setCredentials({
      username: "",
      newPassword: "",
      confirmPassword: "",
    });
    setMessage({ text: "", isError: false });
    setSendCredentialsViaSMS(false);

    // Check if worker has user data in the workerData
    if (workerData && workerData.user) {
      setHasUserAccount(true);
      setCredentials((prev) => ({
        ...prev,
        username: workerData.user.username || "",
      }));
    } else {
      setHasUserAccount(false);
    }
  }, [workerId, workerData]);

  const handleChange = (e, key) => {
    setCredentials({ ...credentials, [key]: e.target.value });
    // Clear any error messages when user starts typing
    if (message.text) {
      setMessage({ text: "", isError: false });
    }
  };

  const toggleSendSMS = () => {
    setSendCredentialsViaSMS(!sendCredentialsViaSMS);
  };

  const validateForm = () => {
    // For existing user accounts
    if (hasUserAccount) {
      // If changing password, confirm password must match
      if (
        credentials.newPassword &&
        credentials.newPassword !== credentials.confirmPassword
      ) {
        setMessage({
          text: "הסיסמאות החדשות אינן תואמות",
          isError: true,
        });
        return false;
      }

      // Must provide at least username or password change
      if (!credentials.username && !credentials.newPassword) {
        setMessage({
          text: "יש לספק שם משתמש חדש או סיסמה חדשה",
          isError: true,
        });
        return false;
      }
    }
    // For new user accounts
    else {
      // Username is required
      if (!credentials.username) {
        setMessage({
          text: "שם משתמש הוא שדה חובה",
          isError: true,
        });
        return false;
      }

      // New password is required
      if (!credentials.newPassword) {
        setMessage({
          text: "סיסמה היא שדה חובה",
          isError: true,
        });
        return false;
      }

      // Confirm password must match
      if (credentials.newPassword !== credentials.confirmPassword) {
        setMessage({
          text: "הסיסמאות אינן תואמות",
          isError: true,
        });
        return false;
      }
    }

    // Validate phone number if sending SMS
    if (
      sendCredentialsViaSMS &&
      (!workerData?.primaryPhone || workerData.primaryPhone.trim() === "")
    ) {
      setMessage({
        text: "לא ניתן לשלוח SMS - מספר טלפון חסר",
        isError: true,
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword({
        workerId,
        username: credentials.username,
        newPassword: credentials.newPassword,
      });

      if (result.ok) {
        setMessage({ text: result.message, isError: false });

        // Send SMS with credentials if option is selected
        if (sendCredentialsViaSMS && workerData?.primaryPhone) {
          try {
            const isNewAccount = !hasUserAccount;
            const smsMessage = isNewAccount
              ? `שלום, נוצר עבורך חשבון חדש במערכת הניהול החקלאית. שם משתמש: ${credentials.username}, סיסמה: ${credentials.newPassword}`
              : `שלום, פרטי הכניסה שלך למערכת הניהול החקלאית עודכנו. שם משתמש: ${
                  credentials.username
                }${
                  credentials.newPassword
                    ? `, סיסמה: ${credentials.newPassword}`
                    : ""
                }`;

            const smsSent = await sendSMS(
              workerData.primaryPhone,
              smsMessage,
              workerId,
              null,
              null,
              null,
              "ORGANIZATION",
              "WORKER"
            );

            if (smsSent) {
              setMessage({
                text: `${result.message} פרטי הכניסה נשלחו ב-SMS למספר ${workerData.primaryPhone}`,
                isError: false,
              });
            } else {
              setMessage({
                text: `${result.message} אך שליחת ה-SMS נכשלה`,
                isError: false,
              });
            }
          } catch (smsError) {
            console.error("Error sending SMS:", smsError);
            setMessage({
              text: `${result.message} אך שליחת ה-SMS נכשלה: ${smsError.message}`,
              isError: false,
            });
          }
        }

        // Clear password fields after successful update
        setCredentials({
          ...credentials,
          newPassword: "",
          confirmPassword: "",
        });

        // Update account status if a new account was created
        if (!hasUserAccount) {
          setHasUserAccount(true);
        }

        // Reset SMS checkbox
        setSendCredentialsViaSMS(false);
      } else {
        setMessage({ text: result.message, isError: true });
      }
    } catch (error) {
      console.error("Error updating credentials:", error);
      setMessage({
        text: "אירעה שגיאה בעדכון פרטי ההתחברות",
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <h1>הרשאות</h1>
        {hasUserAccount ? (
          <div className={styles.accountStatus}>
            <span className={styles.statusBadge}>✓ חשבון משתמש קיים</span>
          </div>
        ) : (
          <div className={styles.accountStatus}>
            <span className={styles.noAccountBadge}>אין חשבון משתמש</span>
          </div>
        )}
      </div>

      {message.text && (
        <div
          className={`${styles.message} ${
            message.isError ? styles.error : styles.success
          }`}
        >
          {message.text}
        </div>
      )}

      <div className={styles.formContainer}>
        <div className={styles.block}>
          <div className={styles.right}>
            <h3>פרטי התחברות</h3>
          </div>
          <div className={styles.left}>
            <div className={styles.fields}>
              <TextField
                label="שם משתמש"
                width="48.3%"
                value={credentials.username}
                onChange={(e) => handleChange(e, "username")}
                autoComplete="off"
                {...{ "data-autocomplete-disable": "true" }}
                required
              />

              <TextField
                label={hasUserAccount ? "סיסמה חדשה" : "סיסמה"}
                width="48.3%"
                type="password"
                value={credentials.newPassword}
                onChange={(e) => handleChange(e, "newPassword")}
                autoComplete="new-password"
                {...{ "data-autocomplete-disable": "true" }}
                required={!hasUserAccount}
              />

              <TextField
                label="אימות סיסמה"
                width="48.3%"
                type="password"
                value={credentials.confirmPassword}
                onChange={(e) => handleChange(e, "confirmPassword")}
                autoComplete="new-password"
                {...{ "data-autocomplete-disable": "true" }}
                required={!hasUserAccount || !!credentials.newPassword}
              />

              <div className={styles.smsOption}>
                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    checked={sendCredentialsViaSMS}
                    onChange={toggleSendSMS}
                    disabled={!workerData?.primaryPhone}
                  />
                  <span className={styles.checkmark}></span>
                  <span className={styles.checkboxLabel}>
                    שלח פרטי התחברות ב-SMS
                    {workerData?.primaryPhone && (
                      <span className={styles.phoneNumber}>
                        למספר {workerData.primaryPhone}
                      </span>
                    )}
                    {!workerData?.primaryPhone && (
                      <span className={styles.noPhone}>
                        (אין מספר טלפון זמין)
                      </span>
                    )}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.btns}>
          <button type="button">ביטול</button>
          <button type="button" onClick={handleSave} disabled={loading}>
            {loading ? (
              <Spinner color="#ffffff" />
            ) : hasUserAccount ? (
              "עדכון פרטים"
            ) : (
              "יצירת חשבון"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Credentials;
