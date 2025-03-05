"use client";

import { useState } from "react";
import { format } from "date-fns";
import { FaEye } from "react-icons/fa";
import styles from "@/styles/containers/attendance-groups/detailed-records-table.module.scss";
import GroupAttendanceDetailsModal from "./detailsModal";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "—";
  }
};

// Status component
const RequestStatus = ({ status }) => {
  const getStatusClassName = () => {
    switch (status) {
      case "APPROVED":
        return styles.approved;
      case "REJECTED":
        return styles.rejected;
      default:
        return styles.pending;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "APPROVED":
        return "אושר";
      case "REJECTED":
        return "נדחה";
      default:
        return "ממתין";
    }
  };

  return (
    <span className={`${styles.statusBadge} ${getStatusClassName()}`}>
      {getStatusText()}
    </span>
  );
};

const DetailedRecordsTable = ({ records, onSelectRequest }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);

  const handleViewDetails = (record) => {
    setSelectedRequest(record);
    if (onSelectRequest) {
      onSelectRequest(record);
    }
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
  };

  if (!records || records.length === 0) {
    return <p className={styles.emptyMessage}>אין רשומות לתצוגה</p>;
  }

  console.log(records, "RECORDS");

  return (
    <>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.headerCell}>עובד נוכחות</th>
              <th className={styles.headerCell}>קבוצת עובדים</th>
              <th className={styles.headerCell}>עובד</th>
              <th className={styles.headerCell}>מיכלים</th>
              <th className={styles.headerCell}>סטטוס</th>
              <th className={styles.headerCell}>מועד אישור/דחייה</th>
              <th className={styles.headerCell}>פעולות</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {records.map((record) => (
              <tr key={record.id} className={styles.tableRow}>
                {record.attendanceDoneBy === "WORKER" ? (
                  <td className={styles.tableCell}>
                    {record.worker?.nameHe + " " + record.worker?.surnameHe}
                  </td>
                ) : (
                  <td className={styles.tableCell}>
                    {record.manager?.name
                      ? record.manager?.name
                      : record.leader?.worker?.nameHe
                      ? record.leader?.worker?.nameHe
                      : "לא צוין"}
                  </td>
                )}
                <td className={styles.tableCell}>
                  {record.group?.name || "—"}
                </td>
                <td className={styles.tableCell}>
                  {record.worker
                    ? `${record.worker.nameHe || ""} ${
                        record.worker.surnameHe || ""
                      }`.trim()
                    : "—"}
                </td>
                <td className={styles.tableCell}>
                  {record.totalContainersFilled || "—"}
                </td>
                <td className={styles.tableCell}>
                  <RequestStatus status={record.approvalStatus} />
                </td>
                <td className={styles.tableCell}>
                  {formatDate(record.approvalDate)}
                </td>
                <td className={styles.tableCell}>
                  <button
                    onClick={() => handleViewDetails(record)}
                    className={styles.actionButton}
                  >
                    <FaEye className={styles.icon} />
                    <span>פרטים</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <GroupAttendanceDetailsModal
          request={selectedRequest}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default DetailedRecordsTable;
