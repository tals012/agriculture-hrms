"use client";
import { useState } from "react";
import FieldsTable from "@/containers/bigModals/client/fields/fieldsTable";
import GroupsTable from "@/containers/bigModals/client/fields/groupsTable";
import CreateGroup from "@/smallModals/client/createGroup";
import getWorkers from "@/app/(backend)/actions/workers/getWorkers";
import { getPricing } from "@/app/(backend)/actions/clients/getPricing";
import styles from "@/styles/bigModals/client/tabs/managers.module.scss";

const Fields = ({ clientId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isCreateFieldModalOpen, setIsCreateFieldModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [createFieldStatus, setCreateFieldStatus] = useState(null);
  const [createGroupStatus, setCreateGroupStatus] = useState(null);
  const [fields, setFields] = useState([]);
  const [managers, setManagers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [pricingCombinations, setPricingCombinations] = useState([]);

  const fetchWorkersAndPricing = async () => {
    try {
      const [workersRes, pricingRes] = await Promise.all([
        getWorkers({ clientId }),
        getPricing({ clientId })
      ]);

      if (workersRes?.status === 200) {
        setWorkers(workersRes.data);
      }

      if (pricingRes?.status === 200) {
        setPricingCombinations(pricingRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>שדות וקבוצות</h1>

      <div className={styles.tabs}>
        <div 
          className={`${styles.tab} ${activeTab === 0 ? styles.active : ""}`}
          onClick={() => setActiveTab(0)}
        >
          <p>שדות</p>
        </div>
        <div 
          className={`${styles.tab} ${activeTab === 1 ? styles.active : ""}`}
          onClick={() => {
            setActiveTab(1);
            fetchWorkersAndPricing();
          }}
        >
          <p>קבוצות</p>
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 0 ? (
          <FieldsTable
            setIsCreateFieldModalOpen={setIsCreateFieldModalOpen}
            createFieldStatus={createFieldStatus}
            setCreateFieldStatus={setCreateFieldStatus}
            clientId={clientId}
            setFields={setFields}
          />
        ) : (
          <GroupsTable
            setIsCreateGroupModalOpen={setIsCreateGroupModalOpen}
            createGroupStatus={createGroupStatus}
            setCreateGroupStatus={setCreateGroupStatus}
            clientId={clientId}
            fields={fields}
            setManagers={setManagers}
          />
        )}
      </div>

      {isCreateGroupModalOpen && (
        <CreateGroup
          setModalOpen={setIsCreateGroupModalOpen}
          setCreateStatus={setCreateGroupStatus}
          clientId={clientId}
          fields={fields}
          workers={workers}
          pricingCombinations={pricingCombinations}
        />
      )}
    </div>
  );
};

export default Fields; 