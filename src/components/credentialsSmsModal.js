"use client";

import Modal from "./modal";
import { FaSms } from "react-icons/fa";
import Spinner from "@/components/spinner";
import styles from "@/styles/components/credentialsSmsModal.module.scss";

const CredentialsSmsModal = ({
  isOpen,
  onClose,
  name,
  username,

  password,
  onSend,
  onGenerate,
  loading,
  generating,

}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="פרטי התחברות">
      <div className={styles.container}>
        <p className={styles.name}>{name}</p>
        <div className={styles.field}>
          <label>שם משתמש</label>
          <input type="text" value={username || ""} readOnly />
        </div>

        {password && (
          <div className={styles.field}>
            <label>סיסמה</label>
            <input type="text" value={password} readOnly />
          </div>
        )}
        <div className={styles.actions}>
          <button
            className={styles.generateButton}
            onClick={onGenerate}
            disabled={generating}
          >
            {generating ? <Spinner size={20} /> : "יצירת סיסמה מהירה"}
          </button>
          <button className={styles.smsButton} onClick={onSend} disabled={loading}>
            {loading ? (
              <Spinner size={20} />
            ) : (
              <>
                <FaSms style={{ marginLeft: "8px" }} />
                שלח פרטים ב-SMS
              </>
            )}
          </button>
        </div>

      </div>
    </Modal>
  );
};

export default CredentialsSmsModal;
