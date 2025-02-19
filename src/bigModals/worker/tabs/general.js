"use client";

import { useState } from "react";
import Personal from "@/containers/bigModals/worker/general/personal";
import styles from "@/styles/bigModals/worker/tabs/general.module.scss";
import { toast } from "react-toastify";

const General = ({ personalData, setPersonalData, workerId }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch("/api/salary/register-worker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workerId }),
      });

      if (response.ok) {
        toast.success("Synced with salary system");
      } else {
        toast.error("Failed to sync with salary system");
      }
    } catch (error) {
      toast.error("Failed to sync with salary system");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.head}>
        <h1>פרטי עובד</h1>
        <button onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? "Syncing..." : "Sync with salary system"}
        </button>
      </div>
      <Personal
        personalData={personalData}
        setPersonalData={setPersonalData}
        workerId={workerId}
      />
    </div>
  );
};

export default General;
