"use client";

import { useState, useCallback } from "react";
import ScreenHead from "@/components/screenHead";
import FilterRow from "@/containers/salary/filterRow";
import Table from "@/containers/salary/table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/screens/salary.module.scss";
import Spinner from "@/components/spinner";

// Mock data for development
const mockData = {
  workers: [
    {
      id: 1,
      name: "דוד כהן",
      totalHours: 182.5,
      workedDays: 22,
      sickDays: 1,
      totalContainers: 450,
      totalWage: 12500,
      bonus: 1200
    },
    {
      id: 2,
      name: "משה לוי",
      totalHours: 165.0,
      workedDays: 20,
      sickDays: 2,
      totalContainers: 380,
      totalWage: 11200,
      bonus: 800
    },
    {
      id: 3,
      name: "יעקב ישראלי",
      totalHours: 190.5,
      workedDays: 23,
      sickDays: 0,
      totalContainers: 520,
      totalWage: 13800,
      bonus: 1500
    },
    {
      id: 4,
      name: "שרה כהן",
      totalHours: 148.0,
      workedDays: 18,
      sickDays: 3,
      totalContainers: 320,
      totalWage: 9800,
      bonus: 600
    },
    {
      id: 5,
      name: "רחל אברהם",
      totalHours: 176.0,
      workedDays: 21,
      sickDays: 1,
      totalContainers: 410,
      totalWage: 11900,
      bonus: 950
    },
    {
      id: 6,
      name: "יוסף מזרחי",
      totalHours: 184.5,
      workedDays: 22,
      sickDays: 0,
      totalContainers: 470,
      totalWage: 12800,
      bonus: 1300
    },
    {
      id: 7,
      name: "חנה פרץ",
      totalHours: 160.0,
      workedDays: 19,
      sickDays: 2,
      totalContainers: 350,
      totalWage: 10500,
      bonus: 750
    },
    {
      id: 8,
      name: "אברהם דוידוב",
      totalHours: 172.5,
      workedDays: 21,
      sickDays: 1,
      totalContainers: 430,
      totalWage: 11600,
      bonus: 1000
    }
  ]
};

export default function Salary() {
  const [state, setState] = useState({
    salaryData: null,
    loading: false,
    sendingToSystem: false,
  });

  const handleFilterChange = useCallback(async (filters) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      // TODO: Implement salary data fetching
      // For now, just simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setState(prev => ({
        ...prev,
        loading: false,
        salaryData: mockData
      }));
    } catch (error) {
      console.error("Error fetching salary data:", error);
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
      // For now, just simulate an API call
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
