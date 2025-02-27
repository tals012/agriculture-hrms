"use client";
import { useState } from "react";
import { FaTimes, FaCheck, FaTimes as FaReject, FaClock } from "react-icons/fa";
import styles from "@/styles/containers/attendance-requests/detailsModal.module.scss";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "לא צוין";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString;
  }
};

// Helper function to format time from minutes
const formatTimeFromMinutes = (minutes) => {
  if (minutes === undefined || minutes === null) return "לא צוין";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

// Translate issues to Hebrew
const translateIssue = (issue) => {
  const issueMap = {
    CONTAINERS_MISSING: "מחסור בארגזים",
    MISSING_EQUIPMENT: "חוסר בציוד",
    QUALITY_ISSUES: "בעיות איכות",
    WEATHER_ISSUES: "בעיות מזג אוויר",
    TRANSPORTATION_ISSUES: "בעיות הסעה",
    WORKERS_ABSENT: "היעדרות עובדים",
    INSUFFICIENT_FRUIT: "חוסר בפרי",
    OTHER: "אחר",
  };
  return issueMap[issue] || issue;
};

// Status icon component
const StatusIcon = ({ status }) => {
  switch (status) {
    case "APPROVED":
      return <FaCheck />;
    case "REJECTED":
      return <FaReject />;
    case "PENDING":
    default:
      return <FaClock />;
  }
};

export default function GroupAttendanceDetailsModal({ request, onClose }) {
  if (!request) return null;

  const {
    id,
    attendanceDate,
    createdAt,
    manager,
    leader,
    group,
    worker,
    combination,
    totalContainersFilled,
    approvalStatus,
    approvalDate,
    rejectionReason,
    issues,
    startTimeInMinutes,
    endTimeInMinutes,
    breakTimeInMinutes,
    totalHoursWorked,
    status
  } = request;

  const workerName = worker ? `${worker.nameHe || ""} ${worker.surnameHe || ""}`.trim() : "לא צוין";
  const managerName = manager?.name ? manager.name : leader?.worker?.nameHe ? leader.worker.nameHe : "לא צוין";
  const groupName = group?.name || "לא צוין";
  const harvestType = combination?.harvestType?.name || "לא צוין";
  const species = combination?.species?.name || "לא צוין";

  // Format status text
  const getStatusText = (status) => {
    switch (status) {
      case "APPROVED":
        return "מאושר";
      case "REJECTED":
        return "נדחה";
      case "PENDING":
      default:
        return "ממתין לאישור";
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h3>פרטי דיווח נוכחות קבוצתי</h3>
            <span className={styles.reportId}>מזהה: {id.substring(0, 8)}</span>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.statusBadge} data-status={approvalStatus}>
            <StatusIcon status={approvalStatus} />
            {getStatusText(approvalStatus)}
          </div>
          
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>פרטי דיווח</h4>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>תאריך נוכחות:</span>
                <span className={styles.detailValue}>{formatDate(attendanceDate)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>תאריך דיווח:</span>
                <span className={styles.detailValue}>{formatDate(createdAt)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>מנהל שדה:</span>
                <span className={styles.detailValue}>{managerName}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>קבוצת עבודה:</span>
                <span className={styles.detailValue}>{groupName}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>פרטי עובד וקטיף</h4>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>שם העובד:</span>
                <span className={styles.detailValue}>{workerName}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>סוג קטיף:</span>
                <span className={styles.detailValue}>{harvestType}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>זן:</span>
                <span className={styles.detailValue}>{species}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>ארגזים שמולאו:</span>
                <span className={styles.detailValue}>
                  {totalContainersFilled !== undefined ? totalContainersFilled : "לא צוין"}
                </span>
              </div>
            </div>
          </div>
          
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>סטטוס אישור</h4>
            <div className={styles.detailsGrid}>
              {approvalDate && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>תאריך אישור/דחייה:</span>
                  <span className={styles.detailValue}>{formatDate(approvalDate)}</span>
                </div>
              )}
              {approvalStatus === "REJECTED" && rejectionReason && (
                <div className={`${styles.detailItem} ${styles.rejectionReason}`}>
                  <span className={styles.detailLabel}>סיבת דחייה:</span>
                  <span className={styles.detailValue}>{rejectionReason}</span>
                </div>
              )}
            </div>
          </div>
          
          {issues && issues.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>בעיות שדווחו</h4>
              <ul className={styles.issuesList}>
                {issues.map((issue, index) => (
                  <li key={index}>{translateIssue(issue)}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>מידע נוסף</h4>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>שעת התחלה:</span>
                <span className={styles.detailValue}>
                  {formatTimeFromMinutes(startTimeInMinutes)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>שעת סיום:</span>
                <span className={styles.detailValue}>
                  {formatTimeFromMinutes(endTimeInMinutes)}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>זמן הפסקה (דקות):</span>
                <span className={styles.detailValue}>
                  {breakTimeInMinutes !== undefined ? breakTimeInMinutes : "לא צוין"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>סה"כ שעות עבודה:</span>
                <span className={styles.detailValue}>
                  {totalHoursWorked !== undefined ? totalHoursWorked.toFixed(2) : "לא צוין"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>סטטוס עובד:</span>
                <span className={styles.detailValue}>
                  {status === "PRESENT" ? "נוכח" : 
                   status === "ABSENT" ? "נעדר" : 
                   status === "PARTIAL_DAY" ? "יום חלקי" : 
                   status || "לא צוין"}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.closeModalButton}
            onClick={onClose}
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
} 