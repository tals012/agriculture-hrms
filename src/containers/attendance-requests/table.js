"use client";
import { useState, useRef, useEffect } from "react";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import styles from "@/styles/screens/attendance-requests.module.scss";
import AttendanceDetailsModal from "./detailsModal";
import RejectionReasonForm from "./rejectionForm";

// Custom Edit Icon Component
const EditIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.editIconSvg}
  >
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
    <path d="m15 5 4 4" />
  </svg>
);

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

// Status component with appropriate styling based on status for the table
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

// Function to update attendance record
const updateAttendance = async (attendanceId, data) => {
  try {
    const response = await fetch(`/api/attendance/${attendanceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "שגיאה בעדכון הנתונים");
    }

    const responseData = await response.json();
    console.log("Server response:", responseData); // Debugging
    return responseData;
  } catch (error) {
    console.error("Error updating attendance:", error);
    throw error;
  }
};

export default function AttendanceRequestsTable({
  requests: initialRequests,
  onStatusChange,
  loading,
  onRecordUpdate,
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [processingIds, setProcessingIds] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionRequest, setRejectionRequest] = useState(null);
  const [editingContainers, setEditingContainers] = useState(null);
  const [containerValue, setContainerValue] = useState("");

  // Add a key to force re-render
  const [refreshKey, setRefreshKey] = useState(0);

  // Create a map to track container value cells
  const containerCellsRef = useRef({});

  // Calculate total containers for summary row
  const totalContainers = requests.reduce((sum, r) => {
    return sum + (r.totalContainersFilled || 0);
  }, 0);

  // Force re-render the entire table
  const forceRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // Register a cell reference
  const registerContainerCell = (requestId, ref) => {
    if (ref) {
      containerCellsRef.current[requestId] = ref;
    }
  };

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

  // Start editing containers for a request
  const handleEditContainers = (request) => {
    setEditingContainers(request.id);
    setContainerValue(request.totalContainersFilled || "");
  };

  // Save edited containers value
  const saveContainers = async (requestId) => {
    if (!containerValue.trim() || isNaN(containerValue)) {
      toast.error("נא להזין מספר תקין", {
        position: "bottom-center",
        autoClose: 3000,
        rtl: true,
      });
      return;
    }

    try {
      setProcessingIds((prev) => [...prev, requestId]);

      // Convert value to number
      const numericValue = Number(containerValue);

      console.log("Sending update for containers:", numericValue); // Debug log

      // Call API to update the value in the database
      const updatedRecord = await updateAttendance(requestId, {
        totalContainersFilled: numericValue,
      });

      console.log("Received updated record:", updatedRecord); // Debug log

      // Get the updated value from the response
      const updatedContainers = updatedRecord.totalContainersFilled;

      console.log("Updated containers value:", updatedContainers); // Debug log

      // Exit edit mode
      setEditingContainers(null);

      // Update state (even though the render might not show it)
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId
            ? { ...req, totalContainersFilled: updatedContainers }
            : req
        )
      );

      // Direct DOM update (brutal but effective)
      setTimeout(() => {
        // Use the ref to get the DOM element
        const cellRef = containerCellsRef.current[requestId];
        if (cellRef) {
          console.log("Directly updating DOM element");
          // Find the span containing the value and update it
          const valueSpan = cellRef.querySelector("span");
          if (valueSpan) {
            valueSpan.textContent = updatedContainers;
          }
        }
      }, 50);

      console.log("Value should be updated:", updatedContainers);

      // Notify parent component of the update if callback exists
      if (typeof onRecordUpdate === "function") {
        onRecordUpdate(requestId, { totalContainersFilled: updatedContainers });
      }

      // Show success message
      toast.success("מספר הקונטיינרים עודכן בהצלחה", {
        position: "bottom-center",
        autoClose: 3000,
        rtl: true,
      });
    } catch (error) {
      console.error("Error in saveContainers:", error); // More detailed error
      toast.error(error.message || "אירעה שגיאה בעת עדכון מספר הקונטיינרים", {
        position: "bottom-center",
        autoClose: 3000,
        rtl: true,
      });
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== requestId));
    }
  };

  // Cancel editing containers
  const cancelEditContainers = () => {
    setEditingContainers(null);
    setContainerValue("");
  };

  // Handle enter key press in the containers input
  const handleContainersKeyPress = (e, requestId) => {
    if (e.key === "Enter") {
      saveContainers(requestId);
    } else if (e.key === "Escape") {
      cancelEditContainers();
    }
  };

  // Update local requests when props change
  if (initialRequests !== requests && !editingContainers) {
    setRequests(initialRequests);
  }

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
      <div className={styles.tableContainer} key={refreshKey}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>תאריך דיווח</th>
              <th>עובד נוכחות</th>
              <th>קבוצת עובדים</th>
              <th>עובד</th>
              <th>תאריך נוכחות</th>
              <th>סטטוס</th>
              <th>קונטיינרים</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr
                key={`${request.id}-${request.totalContainersFilled}`}
                className={
                  editingContainers === request.id ? styles.editingRow : ""
                }
              >
                <td>{formatDate(request.createdAt)}</td>
                {request.attendanceDoneBy === "WORKER" ? (
                  <td>
                    {request.worker?.nameHe + " " + request.worker?.surnameHe}
                  </td>
                ) : (
                  <td>
                    {request.manager?.name
                      ? request.manager?.name
                      : request.leader?.worker?.nameHe
                      ? request.leader?.worker?.nameHe
                      : "לא צוין"}
                  </td>
                )}
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
                  {editingContainers === request.id ? (
                    <div className={styles.editContainersContainer}>
                      <input
                        type="number"
                        className={styles.editContainersInput}
                        value={containerValue}
                        onChange={(e) => setContainerValue(e.target.value)}
                        onKeyDown={(e) =>
                          handleContainersKeyPress(e, request.id)
                        }
                        autoFocus
                        min="0"
                      />
                      <div className={styles.editContainersActions}>
                        <button
                          className={`${styles.actionButton} ${styles.saveButton}`}
                          onClick={() => saveContainers(request.id)}
                        >
                          <FaCheck />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.cancelButton}`}
                          onClick={cancelEditContainers}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={styles.containersCell}
                      ref={(ref) => registerContainerCell(request.id, ref)}
                    >
                      <span>
                        {request.totalContainersFilled !== undefined
                          ? request.totalContainersFilled
                          : "לא צוין"}
                      </span>
                      <button
                        className={`${styles.actionButton} ${styles.editButton}`}
                        onClick={() => handleEditContainers(request)}
                        title="ערוך כמות קונטיינרים"
                      >
                        <EditIcon />
                      </button>
                    </div>
                  )}
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
          <tfoot>
            <tr className={styles.totalRow}>
              <td colSpan={6}>סך הכל קונטיינרים</td>
              <td>{totalContainers}</td>
              <td></td>
            </tr>
          </tfoot>
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
