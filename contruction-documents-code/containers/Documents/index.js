"use client";
import Button from "@/components/button";
import styles from "@/styles/containers/screens/singleWorker/documents.module.scss";
import React, { useState } from "react";
import DocumentsTable from "./Table";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import useWorkerData from "@/components/workerData";

export default function Documents({ workerId, role }) {
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { data, loading, alert } = useWorkerData(workerId);

  const handleDigitalSignatureClick = () => {
    setIsLoading(true);
    router.push(
      `/${
        role === "ADMIN" ? "admin" : "fieldman"
      }/workers/signed-form/${workerId}`
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h2>מסמכי עובד</h2>
        <div style={{ display: "flex" }}>
          <Button
            w={218}
            h={48}
            onClick={() => setShowUploadDocModal(true)}
            ml={10}
          >
            העלאת / צילום מסמך חדש
          </Button>
          <Button
            w={240}
            h={48}
            onClick={handleDigitalSignatureClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spinner size={20} color={"white"} />
                <span>מוריד מסמכים...</span>
              </div>
            ) : (
              "חתימה על מסמך דיגיטלי"
            )}
          </Button>
        </div>
      </div>

      <DocumentsTable
        workerId={workerId}
        showUploadDocModal={showUploadDocModal}
        onChangeUploadModalState={(e) => setShowUploadDocModal(e)}
      />
    </div>
  );
}
