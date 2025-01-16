"use client";
import { useState } from "react";
import FieldsTable from "@/containers/bigModals/client/fields/fieldsTable";
import styles from "@/styles/bigModals/client/tabs/managers.module.scss";

const Fields = ({
  setIsCreateFieldModalOpen,
  createFieldStatus,
  setCreateFieldStatus,
  clientId,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={styles.container}>
      <h1>שדות</h1>

      {/* 
      // * tabs 
      */}
      <div className={styles.tabs}>
        <div
          className={`${styles.tab} ${activeTab === 0 ? styles.active : ""}`}
          onClick={() => setActiveTab(0)}
        >
          <p>שדות</p>
        </div>
      </div>

      {/* 
      // * content
      */}
      {activeTab === 0 ? (
        <FieldsTable
          setIsCreateFieldModalOpen={setIsCreateFieldModalOpen}
          createFieldStatus={createFieldStatus}
          setCreateFieldStatus={setCreateFieldStatus}
          clientId={clientId}
        />
      ) : activeTab === 1 ? null : null}
    </div>
  );
};

export default Fields; 