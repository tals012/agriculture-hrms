"use client";

import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ScreenHead from "@/components/screenHead";
import styles from "@/styles/screens/attendance-requests.module.scss";
import AttendanceHistoryFilter from "@/containers/attendance-requests/historyFilterRow";
import AttendanceHistoryTable from "@/containers/attendance-requests/historyTable";
import { getAttendanceRequests } from "@/app/(backend)/actions/attendance/getAttendanceRequests";
import Link from "next/link";
import { FaClipboardList } from "react-icons/fa";

export default function AttendanceHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    workerId: null,
    groupId: null,
    approvalStatus: "ALL" // Default to ALL (both approved and rejected)
  });
  const [selectedGroupName, setSelectedGroupName] = useState(null);

  // Fetch attendance requests on initial load and when filters change
  async function fetchAttendanceHistory(filterOptions) {
    setLoading(true);
    try {
      // Ensure all filter values have the correct type
      const typedFilters = {
        year: Number(filterOptions.year) || new Date().getFullYear(), 
        month: Number(filterOptions.month) || new Date().getMonth() + 1,
        workerId: filterOptions.workerId ? String(filterOptions.workerId) : null,
        groupId: filterOptions.groupId ? String(filterOptions.groupId) : null,
        approvalStatus: filterOptions.approvalStatus || "ALL"
      };
      
      // Send the filters directly without modifying approvalStatus
      // This keeps approvalStatus as "ALL" instead of null
      const result = await getAttendanceRequests(typedFilters);
      
      if (result.success) {
        // Filter out pending records if approvalStatus is ALL
        const filteredRecords = typedFilters.approvalStatus === "ALL" 
          ? result.data.filter(record => record.approvalStatus !== "PENDING")
          : result.data;
          
        setAttendanceRecords(filteredRecords);
      } else {
        toast.error("אירעה שגיאה בטעינת הנתונים: " + result.message, {
          position: "bottom-center",
          autoClose: 5000,
          rtl: true
        });
        setAttendanceRecords([]);
      }
    } catch (error) {
      toast.error("אירעה שגיאה בטעינת הנתונים", {
        position: "bottom-center",
        autoClose: 5000,
        rtl: true
      });
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }

  // Load data on initial render
  useEffect(() => {
    fetchAttendanceHistory(filters);
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters, groupName = null) => {
    const processedFilters = {
      year: newFilters.year || new Date().getFullYear(),
      month: newFilters.month || new Date().getMonth() + 1,
      workerId: newFilters.workerId || null,
      groupId: newFilters.groupId || null,
      approvalStatus: newFilters.approvalStatus || "ALL"
    };
    
    // Store the group name if provided
    if (groupName && processedFilters.groupId) {
      setSelectedGroupName(groupName);
    } else if (!processedFilters.groupId) {
      setSelectedGroupName(null);
    }
    
    setFilters(processedFilters);
    fetchAttendanceHistory(processedFilters);
  };

  // Calculate stats for the header
  const approvedCount = attendanceRecords.filter(record => record.approvalStatus === "APPROVED").length;
  const rejectedCount = attendanceRecords.filter(record => record.approvalStatus === "REJECTED").length;
  
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead
          title="היסטוריית דיווחי נוכחות"
          desc="צפייה בדיווחי נוכחות מאושרים ודחויים"
          stats={[
            {
              value: approvedCount,
              text: "דיווחים מאושרים"
            },
            {
              value: rejectedCount,
              text: "דיווחים דחויים"
            }
          ]}
          actions={[
            {
              component: (
                <Link 
                  href="/admin/attendance-requests" 
                  className={styles.pendingLink}
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
                  <FaClipboardList />
                  בקשות ממתינות לאישור
                </Link>
              )
            }
          ]}
        />

        <div className={styles.content}>
          {/* Filter Section */}
          <AttendanceHistoryFilter 
            onFilterChange={handleFilterChange}
            initialFilters={filters}
          />
          
          {/* History Table */}
          <AttendanceHistoryTable 
            requests={attendanceRecords}
            loading={loading}
          />
        </div>
      </div>
      
      <ToastContainer position="bottom-center" rtl={true} />
    </div>
  );
} 