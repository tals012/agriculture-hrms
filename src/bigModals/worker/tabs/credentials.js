"use client";

import { useState, useEffect } from "react";
import TextField from "@/components/textField";
import Spinner from "@/components/spinner";
import styles from "@/styles/bigModals/worker/tabs/credentials.module.scss";
import { updatePassword } from "@/app/(backend)/actions/workers/updatePassword";

const Credentials = ({ workerId, workerData }) => {
  console.log(workerData, "workerData")
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", isError: false });
  const [hasUserAccount, setHasUserAccount] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Use workerData passed from parent component
  useEffect(() => {
    // Reset form when workerId changes
    setCredentials({
      username: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setMessage({ text: "", isError: false });
    
    // Check if worker has user data in the workerData
    if (workerData && workerData.user) {
      setHasUserAccount(true);
      setCredentials(prev => ({
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

  const validateForm = () => {
    // For existing user accounts
    if (hasUserAccount) {
      // If new password is provided, current password is required
      if (credentials.newPassword && !credentials.currentPassword) {
        setMessage({ 
          text: "נדרשת סיסמה נוכחית כדי לשנות את הסיסמה", 
          isError: true 
        });
        return false;
      }
      
      // If changing password, confirm password must match
      if (credentials.newPassword && credentials.newPassword !== credentials.confirmPassword) {
        setMessage({ 
          text: "הסיסמאות החדשות אינן תואמות", 
          isError: true 
        });
        return false;
      }
      
      // Must provide at least username or password change
      if (!credentials.username && !credentials.newPassword) {
        setMessage({ 
          text: "יש לספק שם משתמש חדש או סיסמה חדשה", 
          isError: true 
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
          isError: true 
        });
        return false;
      }
      
      // New password is required
      if (!credentials.newPassword) {
        setMessage({ 
          text: "סיסמה היא שדה חובה", 
          isError: true 
        });
        return false;
      }
      
      // Confirm password must match
      if (credentials.newPassword !== credentials.confirmPassword) {
        setMessage({ 
          text: "הסיסמאות אינן תואמות", 
          isError: true 
        });
        return false;
      }
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
        currentPassword: credentials.currentPassword,
        newPassword: credentials.newPassword,
      });
      
      if (result.ok) {
        setMessage({ text: result.message, isError: false });
        // Clear password fields after successful update
        setCredentials({
          ...credentials,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        
        // Update account status if a new account was created
        if (!hasUserAccount) {
          setHasUserAccount(true);
        }
      } else {
        setMessage({ text: result.message, isError: true });
      }
    } catch (error) {
      console.error("Error updating credentials:", error);
      setMessage({ 
        text: "אירעה שגיאה בעדכון פרטי ההתחברות", 
        isError: true 
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
        <div className={`${styles.message} ${message.isError ? styles.error : styles.success}`}>
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
              
              {hasUserAccount && (
                <TextField
                  label="סיסמה נוכחית"
                  width="48.3%"
                  type="password"
                  value={credentials.currentPassword}
                  onChange={(e) => handleChange(e, "currentPassword")}
                  autoComplete="current-password"
                  {...{ "data-autocomplete-disable": "true" }}
                />
              )}
              
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
            </div>
          </div>
        </div>

        <div className={styles.btns}>
          <button type="button">ביטול</button>
          <button type="button" onClick={handleSave} disabled={loading}>
            {loading ? <Spinner color="#ffffff" /> : hasUserAccount ? "עדכון פרטים" : "יצירת חשבון"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Credentials;
