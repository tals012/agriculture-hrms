"use client";

import ScreenHead from "@/components/screenHead";
import SideBox from "@/containers/schedule-builder/sideBox";
import { useSearchParams } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/screens/schedule-builder.module.scss";

export default function ScheduleBuilder() {
  const searchParams = useSearchParams();
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead
          title="בנאי סדרות"
          desc="כאן תוכל לבנות סדרות עבור כל הסוגים של קטיפים שלך"
          stats={[]}
        />

        <div className={styles.row}>
          <SideBox />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
