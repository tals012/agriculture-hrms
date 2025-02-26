"use client";

import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ScreenHead from "@/components/screenHead";
import styles from "@/styles/containers/attendance-groups/attendance-groups.module.scss";
import AttendanceHistoryFilter from "@/containers/attendance-requests/historyFilterRow";
import GroupedAttendanceTable from "@/containers/attendance-groups/groupedTable";
import { getGroupedAttendanceRecords } from "@/app/(backend)/actions/attendance/getGroupedAttendanceRecords";
import Link from "next/link";
import { FaHistory, FaClipboardCheck } from "react-icons/fa";

export default function AttendanceGroupsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [groupedRecords, setGroupedRecords] = useState([]);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    workerId: null,
    groupId: null,
    approvalStatus: "ALL"
  });
  const [selectedGroupName, setSelectedGroupName] = useState(null);
  
  // Stats
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalApproved, setTotalApproved] = useState(0);
  const [totalRejected, setTotalRejected] = useState(0);
  const [totalContainers, setTotalContainers] = useState(0);

  const fetchGroupedRecords = async (filterOptions) => {
    setIsLoading(true);
    try {
      // Type conversion
      const typedFilters = {
        ...filterOptions,
        year: filterOptions.year ? Number(filterOptions.year) : undefined,
        month: filterOptions.month ? Number(filterOptions.month) : undefined,
        workerId: filterOptions.workerId || undefined,
        groupId: filterOptions.groupId || undefined,
        approvalStatus: filterOptions.approvalStatus || "ALL"
      };

      const response = await getGroupedAttendanceRecords(typedFilters);

      if (response.error) {
        toast.error(`אירעה שגיאה בטעינת הנתונים: ${response.error}`);
        setGroupedRecords([]);
        return;
      }

      // Format dates in the response
      const formattedRecords = response.data.map(group => ({
        ...group,
        formattedDate: new Date(group.date).toLocaleDateString("he-IL", {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }));

      setGroupedRecords(formattedRecords);
      
      // Calculate total stats
      const totalRecs = formattedRecords.reduce((sum, group) => sum + group.records.length, 0);
      const approved = formattedRecords.reduce((sum, group) => sum + group.approvedCount, 0);
      const rejected = formattedRecords.reduce((sum, group) => sum + group.rejectedCount, 0);
      const containers = formattedRecords.reduce((sum, group) => sum + group.totalContainers, 0);
      
      setTotalRecords(totalRecs);
      setTotalApproved(approved);
      setTotalRejected(rejected);
      setTotalContainers(containers);
      
    } catch (error) {
      console.error('Error fetching grouped records:', error);
      toast.error('אירעה שגיאה בטעינת הנתונים');
      setGroupedRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupedRecords(filters);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchGroupedRecords(newFilters);
    
    // Update selected group name for display in header
    if (newFilters.groupId && newFilters.groupId !== filters.groupId) {
      // Would typically fetch from API or context, simplified for demo
      // This would be replaced with actual group name lookup
      setSelectedGroupName("הקבוצה שנבחרה");
    } else if (!newFilters.groupId) {
      setSelectedGroupName(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead 
          title={selectedGroupName ? `רשומות נוכחות - ${selectedGroupName}` : "רשומות נוכחות מקובצות לפי תאריך"} 
          subtitle={`סה"כ ${totalRecords} רשומות, ${totalApproved} מאושרות, ${totalRejected} דחויות, ${Math.round(totalContainers * 10) / 10} מיכלים`}
          stats={[
            {
              value: totalApproved,
              text: "דיווחים מאושרים"
            },
            {
              value: totalRejected,
              text: "דיווחים דחויים"
            },
            {
              value: Math.round(totalContainers * 10) / 10,
              text: "מיכלים סה״כ"
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
          <div className={styles.filterSection}>
            <AttendanceHistoryFilter 
              onFilterChange={handleFilterChange} 
              initialFilters={filters}
              disableFilters={isLoading}
            />
          </div>

          <GroupedAttendanceTable 
            groupedRecords={groupedRecords}
            isLoading={isLoading}
          />
        </div>
      </div>

      <ToastContainer 
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
} 