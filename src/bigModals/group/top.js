"use client";
import Image from "next/image";
import styles from "@/styles/bigModals/group/top.module.scss";

const Top = ({ onClose }) => {
  return (
    <div className={styles.container}>
      <Image
        src="/assets/icons/cross-2.svg"
        alt="close"
        width={24}
        height={24}
        onClick={onClose}
      />
    </div>
  );
};

export default Top;
