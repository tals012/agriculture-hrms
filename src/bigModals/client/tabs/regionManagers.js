"use client";
import { useState } from "react";
import RegionManagersTable from "@/containers/bigModals/client/regionManagers/regionManagersTable";
import AssignFields from "@/containers/bigModals/client/regionManagers/assignFields";
import styles from "@/styles/bigModals/client/tabs/managers.module.scss";

const RegionManagers = ({
  setIsCreateRegionManagerModalOpen,
  createRegionManagerStatus,
  setCreateRegionManagerStatus,
  clientId,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <div className={styles.container}>
      <h1>מנהלי אזור</h1>
      {/* tabs */}
      <div className={styles.tabs}>
        <div
          className={`${styles.tab} ${activeTab === 0 ? styles.active : ""}`}
          onClick={() => setActiveTab(0)}
        >
          <p>מנהלי אזור</p>
        </div>
        <div
          className={`${styles.tab} ${activeTab === 1 ? styles.active : ""}`}
          onClick={() => setActiveTab(1)}
        >
          <p>שייך לשדה</p>
        </div>
      </div>
      {/* content */}
      {activeTab === 0 ? (
        <RegionManagersTable
          setIsCreateRegionManagerModalOpen={setIsCreateRegionManagerModalOpen}
          createRegionManagerStatus={createRegionManagerStatus}
          setCreateRegionManagerStatus={setCreateRegionManagerStatus}
          clientId={clientId}
        />
      ) : activeTab === 1 ? (
        <AssignFields clientId={clientId} />
      ) : null}
    </div>
  );
};

export default RegionManagers;
