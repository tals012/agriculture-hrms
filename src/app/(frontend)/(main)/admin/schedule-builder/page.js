"use client";

import { useState, useEffect } from "react";
import ScreenHead from "@/components/screenHead";
import SideBox from "@/containers/schedule-builder/sideBox";
import FilterRow from "@/containers/schedule-builder/filterRow";
import Table from "@/containers/schedule-builder/table";
import { useSearchParams } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import getSchedule from "@/app/(backend)/actions/schedule/getSchedule";
import Spinner from "@/components/spinner";
import styles from "@/styles/screens/schedule-builder.module.scss";

export default function ScheduleBuilder() {
  const searchParams = useSearchParams();
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFilterChange = async (filters) => {
    try {
      setLoading(true);
      const response = await getSchedule(filters);
      
      if (response.status === 200) {
        setScheduleData(response.data);
      } else {
        setScheduleData(null);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setScheduleData(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load with current month/year
  useEffect(() => {
    const currentDate = new Date();
    handleFilterChange({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
    });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead
          title="בונה הגדרות יומן נוכחות"
          desc="כאן תוכל לבנות סדרות עבור כל הסוגים של קטיפים שלך"
          stats={[]}
        />

        <div className={styles.row}>
          <SideBox />
          <div className={styles.content}>
            <FilterRow onFilterChange={handleFilterChange} />
            {loading ? (
              <div className={styles.loader}>
                <Spinner />
              </div>
            ) : scheduleData ? (
              <Table data={scheduleData} />
            ) : null}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
