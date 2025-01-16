"use client";
import { useState } from "react";
import ManagersTable from "@/containers/bigModals/client/managers/managersTable";
import AssignFields from "@/containers/bigModals/client/managers/assignFields";
import styles from "@/styles/bigModals/client/tabs/managers.module.scss";

const Managers = ({
  setIsCreateManagerModalOpen,
  createManagerStatus,
  setCreateManagerStatus,
  clientId,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <div className={styles.container}>
      <h1>מנהלים</h1>

      {/* 
      // * tabs 
      */}
      <div className={styles.tabs}>
        <div
          className={`${styles.tab} ${activeTab === 0 ? styles.active : ""}`}
          onClick={() => setActiveTab(0)}
        >
          <p>מנהלים</p>
        </div>
        <div
          className={`${styles.tab} ${activeTab === 1 ? styles.active : ""}`}
          onClick={() => setActiveTab(1)}
        >
          <p>שייך לשדה</p>
        </div>
      </div>

      {/* 
      // * content
      */}
      {activeTab === 0 ? (
        <ManagersTable
          setIsCreateManagerModalOpen={setIsCreateManagerModalOpen}
          createManagerStatus={createManagerStatus}
          setCreateManagerStatus={setCreateManagerStatus}
          clientId={clientId}
        />
      ) : activeTab === 1 ? (
        <AssignFields clientId={clientId} />
      ) : null}
    </div>
  );
};

export default Managers;
