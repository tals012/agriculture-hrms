"use client";

import { useState, useCallback, useMemo } from "react";
import ScreenHead from "@/components/screenHead";
import FilterRow from "@/containers/working-hours/filterRow";
import Table from "@/containers/working-hours/table";
import getWorkingSchedule from "@/app/(backend)/actions/workers/getWorkingSchedule";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/screens/working-hours.module.scss";
import Spinner from "@/components/spinner";

export default function WorkingHours() {
  const [state, setState] = useState({
    scheduleData: null,
    loading: false,
    currentWorkerId: null
  });

  const handleFilterChange = useCallback(async (filters) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const response = await getWorkingSchedule(filters);
      
      setState(prev => ({
        ...prev,
        loading: false,
        scheduleData: response.status === 200 ? response.data : null,
        currentWorkerId: response.status === 200 ? filters.workerId : null
      }));
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setState(prev => ({
        ...prev,
        loading: false,
        scheduleData: null,
        currentWorkerId: null
      }));
    }
  }, []);

  const handleDataUpdate = useCallback(async (updatedData) => {
    if (!state.loading && state.currentWorkerId) {
      const currentDate = new Date();
      await handleFilterChange({
        workerId: state.currentWorkerId,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      });
    }
  }, [state.currentWorkerId, state.loading, handleFilterChange]);

  const tableProps = useMemo(() => ({
    data: state.scheduleData,
    workerId: state.currentWorkerId,
    onDataUpdate: handleDataUpdate
  }), [state.scheduleData, state.currentWorkerId, handleDataUpdate]);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead
          title="שעות עבודה"
          desc="כאן תוכל לנהל את שעות העבודה של העובדים שלך"
          stats={[]}
        />

        <div className={styles.row}>
          <div className={styles.content}>
            <FilterRow onFilterChange={handleFilterChange} />
            {state.loading ? (
              <div className={styles.loader}>
                <Spinner />
              </div>
            ) : state.scheduleData ? (
              <Table {...tableProps} />
            ) : null}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
