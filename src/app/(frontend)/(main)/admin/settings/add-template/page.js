"use client";

import TemplateDesigner from "@/containers/settings/templateDesigner";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/screens/addTemplate.module.scss";

export default function AddTemplate() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.main}>
          <div className={styles.mainWrapper}>
            <TemplateDesigner />
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
} 