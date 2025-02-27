"use client";
import { useState } from "react";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import styles from "@/styles/screens/attendance-requests.module.scss";
import AttendanceDetailsModal from "./detailsModal";
import RejectionReasonForm from "./rejectionForm";

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
    return dateString;
  }
};

// Status component with appropriate styling based on status
const RequestStatus = ({ status }) => {
  const statusMap = {
    PENDING: { text: "ממתין לאישור", className: styles.pending },
    APPROVED: { text: "מאושר", className: styles.approved },
    REJECTED: { text: "נדחה", className: styles.rejected },
  };

  const { text, className } = statusMap[status] || {
    text: status,
    className: "",
  };

  return <span className={`${styles.status} ${className}`}>{text}</span>;
};

export default function AttendanceRequestsTable({
  requests,
  onStatusChange,
  loading,
}) {
  const [processingIds, setProcessingIds] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionRequest, setRejectionRequest] = useState(null);

  // Handle approve action
  const handleApprove = async (requestId) => {
    if (processingIds.includes(requestId)) return;

    setProcessingIds((prev) => [...prev, requestId]);
    try {
      // Call the parent's onStatusChange function
      await onStatusChange(requestId, "APPROVED");
    } catch (error) {
      toast.error("אירעה שגיאה בעת עדכון הסטטוס", {
        position: "bottom-center",
        autoClose: 5000,
        rtl: true,
      });
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== requestId));
    }
  };

  // Open rejection form
  const handleReject = (requestId) => {
    setRejectionRequest(requestId);
  };

  // Submit rejection with reason
  const handleSubmitRejection = async (requestId, reason) => {
    if (processingIds.includes(requestId)) return;

    setProcessingIds((prev) => [...prev, requestId]);
    try {
      // Create a FormData object to include the rejection reason
      const formData = new FormData();
      formData.append("attendanceId", requestId);
      formData.append("approvalStatus", "REJECTED");
      formData.append("rejectionReason", reason);

      // Call the parent's onStatusChange function with the form data
      await onStatusChange(requestId, "REJECTED", formData);

      // Close the rejection form
      setRejectionRequest(null);
    } catch (error) {
      throw error; // Let the form component handle the error
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== requestId));
    }
  };

  // Cancel rejection
  const handleCancelRejection = () => {
    setRejectionRequest(null);
  };

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
              <th>עובד נוכחות</th>
              <th>קבוצת עובדים</th>
              <th>עובד</th>
              <th>תאריך נוכחות</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{formatDate(request.createdAt)}</td>
                <td>
                  {request.manager?.name
                    ? request.manager?.name
                    : request.leader?.worker?.nameHe
                    ? request.leader?.worker?.nameHe
                    : "לא צוין"}
                </td>
                <td>{request.group?.name || "לא צוין"}</td>
                <td>
                  {`${request.worker?.nameHe || ""} ${
                    request.worker?.surnameHe || ""
                  }`.trim() || "לא צוין"}
                </td>
                <td>{formatDate(request.attendanceDate)}</td>
                <td>
                  <RequestStatus status={request.approvalStatus} />
                </td>
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

                    {request.approvalStatus === "PENDING" && (
                      <>
                        <button
                          className={`${styles.actionButton} ${styles.approveButton}`}
                          onClick={() => handleApprove(request.id)}
                          disabled={processingIds.includes(request.id)}
                        >
                          <FaCheck />
                          <span>אישור</span>
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.rejectButton}`}
                          onClick={() => handleReject(request.id)}
                          disabled={processingIds.includes(request.id)}
                        >
                          <FaTimes />
                          <span>דחייה</span>
                        </button>
                      </>
                    )}
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

      {rejectionRequest && (
        <RejectionReasonForm
          requestId={rejectionRequest}
          onSubmit={handleSubmitRejection}
          onCancel={handleCancelRejection}
        />
      )}
    </>
  );
}
