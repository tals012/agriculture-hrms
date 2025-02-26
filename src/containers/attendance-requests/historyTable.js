"use client";
import { useState } from "react";
import { FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import styles from "@/styles/screens/attendance-requests.module.scss";
import AttendanceDetailsModal from "./detailsModal";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "לא צוין";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

// Status component with appropriate styling based on status
const RequestStatus = ({ status }) => {
  const statusMap = {
    PENDING: { text: "ממתין לאישור", className: styles.pending },
    APPROVED: { text: "מאושר", className: styles.approved },
    REJECTED: { text: "נדחה", className: styles.rejected }
  };
  
  const { text, className } = statusMap[status] || { text: status, className: "" };
  
  return (
    <span className={`${styles.status} ${className}`}>
      {text}
    </span>
  );
};

export default function AttendanceHistoryTable({ requests, loading }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Open details modal
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };
  
  // Close details modal
  const handleCloseModal = () => {
    setSelectedRequest(null);
  };
  
  if (loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
        </div>
        <p>טוען נתונים...</p>
      </div>
    );
  }
  
  if (!requests || requests.length === 0) {
    return (
      <div className={styles.noData}>
        <p>לא נמצאו דיווחי נוכחות התואמים את הפילטרים שנבחרו</p>
      </div>
    );
  }
  
  return (
    <>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>תאריך דיווח</th>
              <th>מנהל שדה</th>
              <th>קבוצת עובדים</th>
              <th>עובד</th>
              <th>תאריך נוכחות</th>
              <th>סטטוס</th>
              <th>תאריך אישור/דחייה</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{formatDate(request.createdAt)}</td>
                <td>{request.manager?.name || "לא צוין"}</td>
                <td>{request.group?.name || "לא צוין"}</td>
                <td>{`${request.worker?.nameHe || ""} ${request.worker?.surnameHe || ""}`.trim() || "לא צוין"}</td>
                <td>{formatDate(request.attendanceDate)}</td>
                <td>
                  <RequestStatus status={request.approvalStatus} />
                </td>
                <td>{formatDate(request.approvalDate)}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={`${styles.actionButton} ${styles.viewButton}`}
                      onClick={() => handleViewDetails(request)}
                      title="צפה בפרטים"
                    >
                      <FaEye />
                      <span>פרטים</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {selectedRequest && (
        <AttendanceDetailsModal 
          request={selectedRequest}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
} 