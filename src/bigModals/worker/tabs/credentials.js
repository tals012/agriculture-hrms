"use client";

import { useState } from "react";
import TextField from "@/components/textField";
import Spinner from "@/components/spinner";
import styles from "@/styles/bigModals/worker/tabs/credentials.module.scss";

const Credentials = ({ workerId }) => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e, key) => {
    setCredentials({ ...credentials, [key]: e.target.value });
  };

  const handleSave = async () => {
    // This function will be implemented later
    setLoading(true);
    // Mock save operation
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <h1>הרשאות</h1>
      </div>
      
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
              />
              <TextField
                label="סיסמה"
                width="48.3%"
                type="password"
                value={credentials.password}
                onChange={(e) => handleChange(e, "password")}
                autoComplete="new-password"
                {...{ "data-autocomplete-disable": "true" }}
              />
            </div>
          </div>
        </div>

        <div className={styles.btns}>
          <button>ביטול</button>
          <button onClick={handleSave}>
            {loading ? <Spinner color="#ffffff" /> : "לשמור שינויים"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Credentials;
