"use client";

import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ScreenHead from "@/components/screenHead";
import styles from "@/styles/screens/attendance-requests.module.scss";
import AttendanceRequestsFilter from "@/containers/attendance-requests/filterRow";
import AttendanceRequestsTable from "@/containers/attendance-requests/table";
import { getAttendanceRequests } from "@/app/(backend)/actions/attendance/getAttendanceRequests";
import { updateApprovalStatus } from "@/app/(backend)/actions/attendance/updateApprovalStatus";
import { bulkUpdateApprovalStatus } from "@/app/(backend)/actions/attendance/bulkUpdateApprovalStatus";
import BulkRejectionForm from "@/containers/attendance-requests/bulkRejectionForm";
import Link from "next/link";
import { FaHistory } from "react-icons/fa";

export default function AttendanceRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [attendanceRequests, setAttendanceRequests] = useState([]);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    workerId: null,
    groupId: null,
    approvalStatus: "PENDING"
  });
  const [selectedGroupName, setSelectedGroupName] = useState(null);
  const [showBulkRejectionForm, setShowBulkRejectionForm] = useState(false);
  const [processingBulkAction, setProcessingBulkAction] = useState(false);

  // Fetch attendance requests on initial load and when filters change
  async function fetchAttendanceRequests(filterOptions) {
    setLoading(true);
    try {
      const result = await getAttendanceRequests(filterOptions);
      if (result.success) {
        console.log(result.data, "result.data");
        setAttendanceRequests(result.data);
      } else {
        toast.error("אירעה שגיאה בטעינת הנתונים: " + result.message, {
          position: "bottom-center",
          autoClose: 5000,
          rtl: true
        });
        setAttendanceRequests([]);
      }
    } catch (error) {
      toast.error("אירעה שגיאה בטעינת הנתונים", {
        position: "bottom-center",
        autoClose: 5000,
        rtl: true
      });
      setAttendanceRequests([]);
    } finally {
      setLoading(false);
    }
  }

  // Load data on initial render
  useEffect(() => {
    fetchAttendanceRequests(filters);
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters, groupName = null) => {
    // Make sure all fields are present and have appropriate defaults
    const processedFilters = {

      year: newFilters.year !== undefined ? newFilters.year : new Date().getFullYear(),
      month:
        newFilters.month !== undefined ? newFilters.month : new Date().getMonth() + 1,

      workerId: newFilters.workerId || null,
      groupId: newFilters.groupId || null,
      approvalStatus: "PENDING",
    };

    if (newFilters.day !== undefined) {
      processedFilters.day = newFilters.day;
    }
    
    // Store the group name if provided
    if (groupName && processedFilters.groupId) {
      setSelectedGroupName(groupName);
    } else if (!processedFilters.groupId) {
      setSelectedGroupName(null);
    }
    
    setFilters(processedFilters);
    fetchAttendanceRequests(processedFilters);
  };

  // Handle single record status change
  const handleStatusChange = async (requestId, newStatus, formData = null) => {
    try {
      // If formData is provided, use it directly (for rejections with reason)
      let data;
      
      if (formData) {
        // For rejections, include the rejection reason
        data = new FormData();
        data.append("attendanceId", formData.get("attendanceId"));
        data.append("approvalStatus", formData.get("approvalStatus"));
        if (formData.get("rejectionReason")) {
          data.append("rejectionReason", formData.get("rejectionReason"));
        }
      } else {
        // Create a FormData object to pass to the server action
        data = new FormData();
        data.append("attendanceId", requestId);
        data.append("approvalStatus", newStatus);
      }

      // Call the server action
      const result = await updateApprovalStatus(data);

      if (result.success) {
        // Update the local state with the new status
        setAttendanceRequests(prev => 
          prev.map(request => 
            request.id === requestId 
              ? { 
                  ...request, 
                  approvalStatus: newStatus,
                  rejectionReason: formData?.get("rejectionReason") || null,
                  approvalDate: new Date().toISOString()
                } 
              : request
          )
        );
        
        // For rejections, show the reason in the success toast for reference
        if (newStatus === "REJECTED" && formData?.get("rejectionReason")) {
          toast.success(`${result.message} (סיבה: ${formData.get("rejectionReason")})`, {
            position: "bottom-center",
            autoClose: 5000,
            rtl: true
          });
        } else {
          // Show regular success message
          toast.success(result.message, {
            position: "bottom-center",
            autoClose: 5000,
            rtl: true
          });
        }
      } else {
        // Show error message
        toast.error(result.message || "אירעה שגיאה בעדכון הסטטוס", {
          position: "bottom-center",
          autoClose: 5000,
          rtl: true
        });
      }
    } catch (error) {
      toast.error("אירעה שגיאה בעדכון הסטטוס", {
        position: "bottom-center",
        autoClose: 5000,
        rtl: true
      });
      throw error; // Rethrow to allow the calling component to handle it
    }
  };
  
  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (!filters.groupId) {
      toast.error("נא לבחור קבוצה תחילה", {
        position: "bottom-center",
        autoClose: 5000,
        rtl: true
      });
      return;
    }
    
    setProcessingBulkAction(true);
    try {
      // Create FormData for bulk approval
      const formData = new FormData();
      formData.append("groupId", filters.groupId);
      formData.append("approvalStatus", "APPROVED");
      
      // Call the bulk update server action
      const result = await bulkUpdateApprovalStatus(formData);
      
      if (result.success) {
        if (result.count > 0) {
          // Display success message
          toast.success(result.message, {
            position: "bottom-center",
            autoClose: 5000,
            rtl: true
          });
          
          // Refresh the data
          fetchAttendanceRequests(filters);
        } else {
          // No records were updated
          toast.info(result.message, {
            position: "bottom-center",
            autoClose: 5000,
            rtl: true
          });
        }
      } else {
        // Show error message
        toast.error(result.message || "אירעה שגיאה בעדכון סטטוס האישור", {
          position: "bottom-center",
          autoClose: 5000,
          rtl: true
        });
      }
    } catch (error) {
      toast.error("אירעה שגיאה בעדכון סטטוס האישור", {
        position: "bottom-center",
        autoClose: 5000,
        rtl: true
      });
    } finally {
      setProcessingBulkAction(false);
    }
  };
  
  // Open bulk rejection form
  const handleOpenBulkRejectionForm = () => {
    if (!filters.groupId) {
      toast.error("נא לבחור קבוצה תחילה", {
        position: "bottom-center",
        autoClose: 5000,
        rtl: true
      });
      return;
    }
    
    setShowBulkRejectionForm(true);
  };
  
  // Handle bulk reject with reason
  const handleBulkReject = async (groupId, reason) => {
    setProcessingBulkAction(true);
    try {
      // Create FormData for bulk rejection
      const formData = new FormData();
      formData.append("groupId", groupId);
      formData.append("approvalStatus", "REJECTED");
      formData.append("rejectionReason", reason);
      
      // Call the bulk update server action
      const result = await bulkUpdateApprovalStatus(formData);
      
      if (result.success) {
        // Close the form
        setShowBulkRejectionForm(false);
        
        if (result.count > 0) {
          // Display success message
          toast.success(`${result.message} (סיבה: ${reason})`, {
            position: "bottom-center",
            autoClose: 5000,
            rtl: true
          });
          
          // Refresh the data
          fetchAttendanceRequests(filters);
        } else {
          // No records were updated
          toast.info(result.message, {
            position: "bottom-center",
            autoClose: 5000,
            rtl: true
          });
        }
      } else {
        // Show error message
        toast.error(result.message || "אירעה שגיאה בעדכון סטטוס האישור", {
          position: "bottom-center",
          autoClose: 5000,
          rtl: true
        });
      }
    } catch (error) {
      toast.error("אירעה שגיאה בעדכון סטטוס האישור", {
        position: "bottom-center",
        autoClose: 5000,
        rtl: true
      });
    } finally {
      setProcessingBulkAction(false);
    }
  };
  
  // Close bulk rejection form
  const handleCancelBulkRejection = () => {
    setShowBulkRejectionForm(false);
  };
  
  // Calculate pending requests count
  const pendingRequestsCount = attendanceRequests.length || 0;
  
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead
          title="בקשות נוכחות ממתינות לאישור"
          desc="צפייה וטיפול בדיווחי נוכחות ממתינים לאישור שנשלחו על ידי מנהלי השדה"
          stats={[
            {
              value: pendingRequestsCount,
              text: "בקשות ממתינות"
            }
          ]}
          actions={[
            {
              component: (
                <Link 
                  href="/admin/attendance-history" 
                  className={styles.historyLink}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.625rem 1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#f3f4f6",
                    color: "#4b5563",
                    textDecoration: "none",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    transition: "all 0.2s ease"
                  }}
                >
                  <FaHistory />
                  היסטוריית דיווחים
                </Link>
              )
            }
          ]}
        />

        <div className={styles.content}>
          {/* Filter Section */}
          <AttendanceRequestsFilter 
            onFilterChange={handleFilterChange}
            initialFilters={filters}
          />
          
          {/* Bulk Actions */}
          {filters.groupId && (
            <div className={styles.bulkActionsContainer}>
              <div className={styles.bulkActionsInfo}>
                <span className={styles.groupName}>
                  קבוצה: {selectedGroupName || "קבוצה נבחרת"}
                </span>
                <span className={styles.pendingCount}>
                  {pendingRequestsCount} בקשות ממתינות
                </span>
              </div>
              <div className={styles.bulkActionsButtons}>
                <button 
                  className={`${styles.bulkButton} ${styles.approveAll}`}
                  onClick={handleBulkApprove}
                  disabled={processingBulkAction || pendingRequestsCount === 0}
                >
                  אישור כל הבקשות
                </button>
                <button 
                  className={`${styles.bulkButton} ${styles.rejectAll}`}
                  onClick={handleOpenBulkRejectionForm}
                  disabled={processingBulkAction || pendingRequestsCount === 0}
                >
                  דחיית כל הבקשות
                </button>
              </div>
            </div>
          )}
          
          {/* Attendance Requests Table */}
          <AttendanceRequestsTable 
            requests={attendanceRequests}
            onStatusChange={handleStatusChange}
            loading={loading}
          />
        </div>
      </div>
      
      {/* Bulk Rejection Form */}
      {showBulkRejectionForm && (
        <BulkRejectionForm 
          groupId={filters.groupId}
          groupName={selectedGroupName || "קבוצה נבחרת"}
          onSubmit={handleBulkReject}
          onCancel={handleCancelBulkRejection}
        />
      )}
      
      <ToastContainer position="bottom-center" rtl={true} />
    </div>
  );
} 