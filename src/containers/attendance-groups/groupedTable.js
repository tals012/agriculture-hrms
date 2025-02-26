"use client";
import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import Link from "next/link";
import { FaUsers, FaBox, FaCalendarAlt, FaChevronDown, FaChevronUp, FaEye } from "react-icons/fa";
import styles from "@/styles/screens/attendance-requests.module.scss";
import groupStyles from "@/styles/containers/attendance-groups/grouped-table.module.scss";
import GroupAttendanceDetailsModal from "./detailsModal";
import DetailedRecordsTable from "./detailedRecordsTable";

// Helper function to format date
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return format(date, "EEEE, d בMMMM yyyy", { locale: he });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

// Status component with appropriate styling based on status
const RequestStatus = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle()}`}>
      {getStatusText()}
    </span>
  );
};

const GroupedAttendanceTable = ({ groupedRecords, isLoading, onSelectRequest }) => {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);

  const toggleGroup = (date) => {
    setExpandedGroups(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    if (onSelectRequest) {
      onSelectRequest(request);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
        </div>
        <p>טוען נתונים...</p>
      </div>
    );
  }

  if (!groupedRecords || groupedRecords.length === 0) {
    return (
      <div className={styles.noData}>
        <p>לא נמצאו דיווחי נוכחות התואמים את הפילטרים שנבחרו</p>
      </div>
    );
  }

  return (
    <div className={groupStyles.groupedContainer}>
      {groupedRecords.map((group) => (
        <div key={group.date} className={groupStyles.dateGroup}>
          <div 
            className={groupStyles.groupHeader} 
            onClick={() => toggleGroup(group.date)}
            aria-expanded={expandedGroups[group.date]}
            aria-controls={`records-${group.date}`}
          >
            <div className={groupStyles.dateInfo}>
              <FaCalendarAlt className={groupStyles.icon} />
              <span className={groupStyles.date}>{group.formattedDate}</span>
            </div>
            
            <div className={groupStyles.statsContainer}>
              <div className={groupStyles.statItem}>
                <FaUsers className={groupStyles.statIcon} />
                <span className={groupStyles.statValue}>{group.uniqueWorkersCount} עובדים</span>
              </div>
              
              <div className={groupStyles.statItem}>
                <FaBox className={groupStyles.statIcon} />
                <span className={groupStyles.statValue}>{group.totalContainers} מיכלים</span>
              </div>
              
              <div className={groupStyles.approvalStats}>
                <span className={`${groupStyles.statBadge} ${groupStyles.approved}`}>
                  {group.approvedCount} אושרו
                </span>
                <span className={`${groupStyles.statBadge} ${groupStyles.rejected}`}>
                  {group.rejectedCount} נדחו
                </span>
              </div>
              
              <button 
                className={groupStyles.toggleButton}
                aria-label={expandedGroups[group.date] ? "סגור קבוצה" : "פתח קבוצה"}
              >
                {expandedGroups[group.date] ? (
                  <FaChevronUp className={groupStyles.toggleIcon} />
                ) : (
                  <FaChevronDown className={groupStyles.toggleIcon} />
                )}
              </button>
            </div>
          </div>
          
          {expandedGroups[group.date] && (
            <div 
              id={`records-${group.date}`} 
              className={groupStyles.recordsContainer}
            >
              <DetailedRecordsTable 
                records={group.records} 
                onSelectRequest={handleSelectRequest}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GroupedAttendanceTable; 