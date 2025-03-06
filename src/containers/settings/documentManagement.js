"use client";

import React, { useState } from "react";
import DocumentCategories from "./documentCategories";
import DocumentTemplates from "./documentTemplates";
import styles from "@/styles/containers/settings/documentManagement.module.scss";

const DocumentManagement = () => {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab("templates")}
          className={`${styles.tabButton} ${
            activeTab === "templates" ? styles.active : ""
          }`}
        >
          תבניות מסמכים
        </button>
        <button
          onClick={() => setActiveTab("simple")}
          className={`${styles.tabButton} ${
            activeTab === "simple" ? styles.active : ""
          }`}
        >
          קטגוריות פשוטות
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "templates" ? (
          <div className={styles.templateContainer}>
            <div className={styles.categoriesSection}>
              <h2 className={styles.sectionTitle}>קטגוריות תבניות</h2>
              <DocumentCategories initialTab="template" />
            </div>
            <div className={styles.templatesSection}>
              <DocumentTemplates />
            </div>
          </div>
        ) : (
          <div className={styles.simpleContainer}>
            <h2 className={styles.sectionTitle}>קטגוריות מסמכים רגילים</h2>
            <DocumentCategories initialTab="simple" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManagement; 