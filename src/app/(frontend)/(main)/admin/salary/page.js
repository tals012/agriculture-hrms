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
              totalContainers: worker.totalContainersFilled,
              totalWage: worker.totalBaseSalary,
              bonus: worker.totalBonus,
              workedDays: worker.statusCounts.WORKING || 0,
              sickDays: worker.statusCounts.SICK_LEAVE || 0,
              attendancePercentage: worker.attendancePercentage,
              // Container windows
              containersWindow100: worker.containersWindow100,
              containersWindow125: worker.containersWindow125,
              containersWindow150: worker.containersWindow150,
            }))
          }
        }));
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

  const handleSendToSystem = async () => {
    if (!state.salaryData) return;

    setState(prev => ({ ...prev, sendingToSystem: true }));
    try {
      // TODO: Implement sending to salary system
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("הנתונים נשלחו בהצלחה למערכת השכר");
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
                <Table data={state.salaryData} />
                <div className={styles.actions}>
                  <button 
                    className={styles.sendButton}
                    onClick={handleSendToSystem}
                    disabled={state.sendingToSystem}
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
