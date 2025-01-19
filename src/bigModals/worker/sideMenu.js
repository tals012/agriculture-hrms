"use client";

import Image from "next/image";
import styles from "@/styles/bigModals/worker/sideMenu.module.scss";

const SideMenu = ({ items, activeTab, setActiveTab }) => {
  return (
    <div className={styles.container}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`${styles.item} ${activeTab === index ? styles.active : ""}`}
          onClick={() => setActiveTab(index)}
        >
          <div className={styles.icon}>
            <Image
              src={item.icon}
              alt="icon"
              width={item.width}
              height={item.height}
            />
          </div>
          <p>{item.title}</p>
        </div>
      ))}
    </div>
  );
};

export default SideMenu; 