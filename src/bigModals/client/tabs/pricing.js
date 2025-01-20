"use client";
import { useState } from "react";
import PricingTable from "@/containers/bigModals/client/pricing/pricingTable";
import styles from "@/styles/bigModals/client/tabs/pricing.module.scss";

const Pricing = ({
  setIsCreatePricingModalOpen,
  createPricingStatus,
  setCreatePricingStatus,
  clientId,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={styles.container}>
      <h1>תמחור</h1>

      {/* 
      // * tabs 
      */}
      <div className={styles.tabs}>
        <div
          className={`${styles.tab} ${activeTab === 0 ? styles.active : ""}`}
          onClick={() => setActiveTab(0)}
        >
          <p>תמחור</p>
        </div>
      </div>

      {/* 
      // * content
      */}
      {activeTab === 0 ? (
        <PricingTable
          setIsCreatePricingModalOpen={setIsCreatePricingModalOpen}
          createPricingStatus={createPricingStatus}
          setCreatePricingStatus={setCreatePricingStatus}
          clientId={clientId}
        />
      ) : activeTab === 1 ? null : null}
    </div>
  );
};

export default Pricing; 