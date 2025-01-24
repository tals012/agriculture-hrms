"use client";
import { useState } from "react";
import styles from "@/styles/containers/attendance/submit.module.scss";
import { BsArrowLeft, BsCheckCircleFill } from "react-icons/bs";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from "react-toastify";

const attendanceOptions = {
  'present': 'נוכח',
  'absent': 'לא נוכח',
  'day-off': 'יום חופש',
  '0': '0 מכלים',
  '1': '1 מכלים',
  '2': '2 מכלים',
  '2.5': '2.5 מכלים',
  'custom': 'מספר מכלים אחר'
};

const issuesList = {
  'no-comments': 'אין הערות',
  'rain': 'הפרעות גשם',
  'no-containers': 'חוסר במכלים',
  'plot-finished': 'סיום חלקה',
  'harvest-break': 'הפסקת קטיף',
  'no-fruits': 'אין פירות',
  'other': 'אחר'
};

export default function Submit({ data, onUpdate }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDisplayLabel = (optionId, workerId) => {
    if (optionId === 'custom' && data.customContainers?.[workerId]) {
      return `${data.customContainers[workerId]} מכלים`;
    }
    return attendanceOptions[optionId] || '';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implement API call to submit the data
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating API call
      toast.success("הדיווח נשלח בהצלחה!", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
    } catch (error) {
      toast.error("שגיאה בשליחת הדיווח", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>אישור ושליחה</h2>

      <div className={styles.summary}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>פרטים כלליים</h3>
          <div className={styles.sectionContent}>
            <div className={styles.field}>
              <span className={styles.label}>שם מלא:</span>
              <span className={styles.value}>{data.fullName}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>תאריך דיווח:</span>
              <span className={styles.value}>
                {format(data.reportDate, 'dd MMMM yyyy', { locale: he })}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>קבוצה:</span>
              <span className={styles.value}>{data.selectedGroup?.label}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.label}>סוג קטיף:</span>
              <span className={styles.value}>{data.selectedHarvest?.label}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>נוכחות עובדים</h3>
          <div className={styles.workersGrid}>
            {Object.entries(data.workersAttendance || {}).map(([workerId, status]) => (
              <div key={workerId} className={styles.workerCard}>
                <div className={styles.workerName}>
                  John Doe {/* TODO: Get actual worker name */}
                </div>
                <div className={styles.workerStatus}>
                  {getDisplayLabel(status, workerId)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>בעיות והערות</h3>
          <div className={styles.issuesList}>
            {data.selectedIssues?.map(issueId => (
              <div key={issueId} className={styles.issue}>
                <BsCheckCircleFill className={styles.checkIcon} />
                <span>{issuesList[issueId]}</span>
              </div>
            ))}
            {data.selectedIssues?.includes('other') && (
              <div className={styles.otherText}>
                <span className={styles.label}>פירוט:</span>
                <p>{data.otherIssueText}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          onClick={handleSubmit} 
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'שולח...' : 'שלח דיווח'}
          <BsArrowLeft size={20} />
        </button>
      </div>
    </div>
  );
}
