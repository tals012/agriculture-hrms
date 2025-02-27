"use client";
import { useState } from "react";
import styles from "@/styles/containers/attendance/submit.module.scss";
import { BsArrowLeft, BsCheckCircleFill } from "react-icons/bs";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from "react-toastify";
import submitAttendance from "@/app/(backend)/actions/attendance/submitAttendance";

const attendanceOptions = {
  'absent': 'לא נוכח',
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

export default function Submit({ data, onUpdate, managerId, leaderId }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDisplayLabel = (optionId, workerId) => {
    if (optionId === 'custom' && data.customContainers?.[workerId]) {
      return `${data.customContainers[workerId]} מכלים`;
    }
    return attendanceOptions[optionId] || '';
  };

  const handleSubmit = async () => {
    // Pre-submission validation
    if (!data.fullName) {
      toast.error("חסר שם המנהל", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
      return;
    }

    if (!data.selectedGroup || !data.selectedPricing) {
      toast.error("חסרים פרטי קבוצה או סוג קטיף", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
      return;
    }

    if (Object.keys(data.workersAttendance || {}).length === 0) {
      toast.error("לא נבחרו עובדים", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Transform the workers attendance data
      const workersAttendance = Object.entries(data.workersAttendance || {}).map(([workerId, status]) => {
        let containersFilled = 0;
        let workerStatus = "WORKING";
        
        if (status === 'absent') {
          workerStatus = "ABSENT";
          containersFilled = 0;
        } else if (status === 'custom') {
          containersFilled = parseFloat(data.customContainers[workerId]) || 0;
        } else if (status !== 'absent') {
          containersFilled = parseFloat(status) || 0;
        }

        return {
          workerId,
          status: workerStatus,
          containersFilled,
        };
      });

      // Prepare the submission data
      const submissionData = {
        administratorName: data.fullName,
        date: data.reportDate,
        combinationId: data.selectedPricing.value,
        issues: data.selectedIssues || [],
        otherIssueText: data.otherIssueText,
        groupId: data.selectedGroup.value,
        managerId: managerId,
        leaderId: leaderId,
        workersAttendance,
      };

      const response = await submitAttendance(submissionData);

      if (response.status === 201) {
        toast.success("הדיווח נשלח בהצלחה! ממתין לאישור מנהל המערכת", {
          position: "top-center",
          autoClose: 5000,
          rtl: true
        });
        // Reset form or redirect
        window.location.reload();
      } else {
        throw new Error(response.message || 'Failed to submit attendance');
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      toast.error(error.message || "שגיאה בשליחת הדיווח", {
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
              <span className={styles.value}>{data.selectedPricing?.label}</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>נוכחות עובדים</h3>
          <div className={styles.workersGrid}>
            {Object.entries(data.workersAttendance || {}).map(([workerId, status]) => (
              <div key={workerId} className={styles.workerCard}>
                <div className={styles.workerName}>
                  {/* Get worker name from groupWorkers */}
                  {data.groupWorkers.find(worker => worker.worker.id === workerId)?.worker.nameHe} {data.groupWorkers.find(worker => worker.worker.id === workerId)?.worker.surnameHe}
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
        
        <div className={styles.approvalNote}>
          <small>הערה: דיווח זה יועבר למנהל המערכת לאישור לפני שיתווסף לחישוב השכר</small>
        </div>
      </div>
    </div>
  );
}
