"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DocumentsTable from "@/containers/bigModals/worker/documents/table";
import UploadDocModal from "@/containers/bigModals/worker/documents/uploadDocModal";
import styles from "@/styles/bigModals/worker/tabs/documents.module.scss";

const UploadIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path
      d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"
      fill="currentColor"
    />
  </svg>
);

const SignatureIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.icon}
  >
    <path
      d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7zM7 9H4V5h3v4zm10 6h3v4h-3v-4zm0-10h3v4h-3V5z"
      fill="currentColor"
    />
  </svg>
);

const Documents = ({ workerId }) => {
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const router = useRouter();

  const handleDigitalSignatureClick = () => {
    setIsLoading(true);
    router.push(`/admin/workers/signed-form/${workerId}`);
  };
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>מסמכי עובד</h2>
        <div>
          <button 
            onClick={() => setShowUploadDocModal(true)}
            className={styles.actionButton}
          >
            <UploadIcon />
            <span>העלאת / צילום מסמך חדש</span>
          </button>
          <button 
            onClick={handleDigitalSignatureClick} 
            disabled={isLoading}
            className={styles.actionButton}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                <span>טוען...</span>
              </>
            ) : (
              <>
                <SignatureIcon />
                <span>חתימה דיגיטלית</span>
              </>
            )}
          </button>
        </div>
      </div>

      <DocumentsTable
        key={refreshKey}
        workerId={workerId}
        showUploadDocModal={showUploadDocModal}
        onChangeUploadModalState={setShowUploadDocModal}
      />

      {showUploadDocModal && (
        <UploadDocModal
          workerId={workerId}
          onClose={() => setShowUploadDocModal(false)}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default Documents;
