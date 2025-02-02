"use client";

import { useState, useEffect } from "react";
import ScreenHead from "@/components/screenHead";
import FilterRow from "@/containers/working-hours/filterRow";
import Table from "@/containers/working-hours/table";
import { useSearchParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/screens/working-hours.module.scss";
import Spinner from "@/components/spinner";
import getWorkingSchedule from "@/app/(backend)/actions/workers/getWorkingSchedule";

export default function WorkingHours() {
  const searchParams = useSearchParams();
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);

  const handleFilterChange = async (filters) => {
    try {
      setLoading(true);
      
      if (!filters.workerId) {
        setScheduleData(null);
        setSelectedWorkerId(null);
        return;
      }

      setSelectedWorkerId(filters.workerId);
      const response = await getWorkingSchedule({
        workerId: filters.workerId,
        month: filters.month,
        year: filters.year,
      });
      
      if (response.status === 200) {
        setScheduleData(response.data);
      } else {
        setScheduleData(null);
        toast.error(response.message || "Failed to fetch schedule", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching working hours:", error);
      setScheduleData(null);
      toast.error("Error fetching working hours", {
        position: "top-center",
        autoClose: 3000,
      });
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
          title="שעות עבודה"
          desc="כאן תוכל לראות את שעות העבודה של העובדים שלך"
          stats={[]}
        />

        <div className={styles.row}>
          <div className={styles.content}>
            <FilterRow onFilterChange={handleFilterChange} />
            {loading ? (
              <div className={styles.loader}>
                <Spinner />
              </div>
            ) : scheduleData ? (
              <Table 
                data={scheduleData} 
                workerId={selectedWorkerId}
              />
            ) : null}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
