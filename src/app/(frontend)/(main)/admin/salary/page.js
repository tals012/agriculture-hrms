"use client";

import { useState, useCallback } from "react";
import ScreenHead from "@/components/screenHead";
import FilterRow from "@/containers/salary/filterRow";
import Table from "@/containers/salary/table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/screens/salary.module.scss";
import Spinner from "@/components/spinner";
import getMonthlySalaryData from "@/app/(backend)/actions/salary/getMonthlySalaryData";

export default function Salary() {
  const [state, setState] = useState({
    salaryData: null,
    loading: false,
    sendingToSystem: false,
    selectedWorkers: new Set()
  });

  const [filters, setFilters] = useState({
    month: null,
    year: null
  });

  const handleFilterChange = useCallback(async (filters) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const response = await getMonthlySalaryData({
        month: filters.month,
        year: filters.year,
        workerId: filters.workerId,
        groupId: filters.groupId,
        fieldId: filters.fieldId,
        clientId: filters.clientId,
      });

      if (response.status === 200) {
        setState(prev => ({
          ...prev,
          loading: false,
          salaryData: {
            workers: response.data.map(worker => ({
              id: worker.worker.id,
              name: worker.worker.name,

              totalContainers: worker.totalContainers || 0,

              totalBaseSalary: worker.totalBaseSalary || 0,
              totalSalary: worker.totalSalary || 0,
              bonus: worker.bonus || 0,
              totalHours125Salary: worker.totalHours125Salary || 0,
              totalHours150Salary: worker.totalHours150Salary || 0,

              workedDays: worker.workedDays || 0,
              sickDays: worker.sickDays || 0,
              totalHours100: worker.totalHours100 || 0,
              totalHours125: worker.totalHours125 || 0,
              totalHours150: worker.totalHours150 || 0,
            }))
          }
        }));
        setFilters({
          month: filters.month,
          year: filters.year
        });
      } else {
        toast.error(response.message || "שגיאה בטעינת נתוני השכר");
        setState(prev => ({
          ...prev,
          loading: false,
          salaryData: null
        }));
      }
    } catch (error) {
      console.error("Error fetching salary data:", error);
      toast.error("שגיאה בטעינת נתוני השכר");
      setState(prev => ({
        ...prev,
        loading: false,
        salaryData: null
      }));
    }
  }, []);

  const handleWorkerSelection = useCallback((workerId, isSelected) => {
    setState(prev => {
      const newSelectedWorkers = new Set(prev.selectedWorkers);
      if (isSelected) {
        newSelectedWorkers.add(workerId);
      } else {
        newSelectedWorkers.delete(workerId);
      }
      return { ...prev, selectedWorkers: newSelectedWorkers };
    });
  }, []);

  const handleSelectAll = useCallback((isSelected) => {
    setState(prev => {
      const newSelectedWorkers = new Set();
      if (isSelected && prev.salaryData?.workers) {
        prev.salaryData.workers.forEach(worker => newSelectedWorkers.add(worker.id));
      }
      return { ...prev, selectedWorkers: newSelectedWorkers };
    });
  }, []);

  const handleSendToSystem = async () => {
    if (!filters.month || !filters.year) {
      toast.error("נא לבחור חודש ושנה");
      return;
    }

    if (state.selectedWorkers.size === 0) {
      toast.error("נא לבחור לפחות עובד אחד");
      return;
    }

    setState(prev => ({ ...prev, sendingToSystem: true }));
    try {
      const response = await fetch("/api/salary/send-to-salary-system", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          month: filters.month,
          year: filters.year,
          selectedWorkerIds: Array.from(state.selectedWorkers)
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "הנתונים נשלחו בהצלחה למערכת השכר");
        setState(prev => ({ ...prev, selectedWorkers: new Set() }));
      } else {
        toast.error(data.message || "שגיאה בשליחת הנתונים למערכת השכר");
      }
    } catch (error) {
      console.error("Error sending to salary system:", error);
      toast.error("שגיאה בשליחת הנתונים למערכת השכר");
    } finally {
      setState(prev => ({ ...prev, sendingToSystem: false }));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead
          title="משכורות"
          desc="כאן תוכל לנהל את המשכורות של העובדים שלך"
          stats={[]}
        />

        <div className={styles.row}>
          <div className={styles.content}>
            <FilterRow onFilterChange={handleFilterChange} />
            {state.loading ? (
              <div className={styles.loader}>
                <Spinner />
              </div>
            ) : state.salaryData ? (
              <>
                <Table 
                  data={state.salaryData} 
                  selectedWorkers={state.selectedWorkers}
                  onWorkerSelect={handleWorkerSelection}
                  onSelectAll={handleSelectAll}
                />
                <div className={styles.actions}>
                  <button 
                    className={styles.sendButton}
                    onClick={handleSendToSystem}
                    disabled={state.sendingToSystem || state.selectedWorkers.size === 0}
                  >
                    {state.sendingToSystem ? "שולח..." : "שלח למערכת שכר"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
