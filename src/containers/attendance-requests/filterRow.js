"use client";
import { useState, useEffect } from "react";
import ReactSelect from "react-select";
import styles from "@/styles/screens/attendance-requests.module.scss";
import { getWorkerOptions } from "@/app/(backend)/actions/workers/getWorkerOptions";
import { getGroupOptions } from "@/app/(backend)/actions/groups/getGroupOptions";
import { FaFilter, FaSync, FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";

// Helper to generate month options
const getMonthOptions = () => {
  const months = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];

  return months.map((month, index) => ({
    value: index + 1,
    label: month,
  }));
};

// Helper to generate day options (1-31)
const getDayOptions = () => {
  return Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: String(i + 1),
  }));
};

// Helper to generate year options (current year and 2 previous years)
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return [0, 1, 2].map((offset) => ({
    value: currentYear - offset,
    label: `${currentYear - offset}`,
  }));
};

// Enhanced select styling for a more modern look
const selectStyle = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    width: "100%",
    border: `1px solid ${state.isFocused ? "#10b981" : "#e5e7eb"}`,
    boxShadow: state.isFocused ? "0 0 0 2px rgba(16, 185, 129, 0.2)" : "none",
    height: "40px",
    fontSize: "14px",
    color: "#4b5563",
    borderRadius: "8px",
    background: "white",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#10b981",
    },
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#10b981"
      : state.isFocused
      ? "#f9fafb"
      : "white",
    color: state.isSelected ? "white" : "#4b5563",
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: "14px",
    "&:active": {
      backgroundColor: "#f3f4f6",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
    fontSize: "14px",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#4b5563",
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? "#10b981" : "#9ca3af",
    transition: "all 0.2s ease",
    "&:hover": {
      color: "#10b981",
    },
    padding: "0 8px",
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 12px",
  }),
};

export default function AttendanceRequestsFilter({
  onFilterChange,
  initialFilters,
}) {
  const [filters, setFilters] = useState({
    year: initialFilters?.year
      ? { value: initialFilters.year, label: String(initialFilters.year) }
      : {
          value: new Date().getFullYear(),
          label: String(new Date().getFullYear()),
        },
    month: initialFilters?.month
      ? {
          value: initialFilters.month,
          label: getMonthOptions()[initialFilters.month - 1]?.label,
        }
      : {
          value: new Date().getMonth() + 1,
          label: getMonthOptions()[new Date().getMonth()]?.label,
        },
    day: initialFilters?.day
      ? { value: initialFilters.day, label: String(initialFilters.day) }
      : { value: new Date().getDate(), label: String(new Date().getDate()) },
    workerId: initialFilters?.workerId || null,
    groupId: initialFilters?.groupId || null,
  });

  const [workerOptions, setWorkerOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loading, setLoading] = useState(false);

  // Map of group IDs to names for easy lookup
  const [groupMap, setGroupMap] = useState({});

  // Fetch worker options from the server
  useEffect(() => {
    async function fetchWorkerOptions() {
      setLoadingWorkers(true);
      try {
        const result = await getWorkerOptions();

        if (result.success) {
          setWorkerOptions(result.data);
        } else {
          setWorkerOptions([]);
        }
      } catch (error) {
        setWorkerOptions([]);
      } finally {
        setLoadingWorkers(false);
      }
    }

    fetchWorkerOptions();
  }, []);

  // Fetch group options from the server
  useEffect(() => {
    async function fetchGroupOptions() {
      setLoadingGroups(true);
      try {
        const result = await getGroupOptions();

        if (result.success) {
          if (Array.isArray(result.data)) {
            setGroupOptions(result.data);

            // Create a map of group IDs to names
            const groupIdToName = {};
            result.data.forEach((group) => {
              groupIdToName[group.value] = group.label;
            });
            setGroupMap(groupIdToName);
          } else {
            setGroupOptions([]);
          }
        } else {
          setGroupOptions([]);
        }
      } catch (error) {
        setGroupOptions([]);
      } finally {
        setLoadingGroups(false);
      }
    }

    fetchGroupOptions();
  }, []);

  const handleFilterChange = (value, field) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentDay = new Date().getDate();
    const resetFilters = {
      year: { value: currentYear, label: String(currentYear) },
      month: {
        value: currentMonth,
        label: getMonthOptions()[currentMonth - 1]?.label,
      },
      day: { value: currentDay, label: String(currentDay) },
      workerId: null,
      groupId: null,
    };
    setFilters(resetFilters);
    onFilterChange({
      year: currentYear,
      month: currentMonth,
      day: currentDay,
      workerId: null,
      groupId: null,
      approvalStatus: "PENDING",
    });
  };

  const handleApply = () => {
    setLoading(true);
    const formattedFilters = {
      year: filters.year.value,
      month: filters.month.value,
      day: filters.day.value,
      workerId: filters.workerId?.value,
      groupId: filters.groupId?.value,
      approvalStatus: "PENDING",
    };

    if (filters.groupId && groupMap[filters.groupId.value]) {
      onFilterChange(formattedFilters, groupMap[filters.groupId.value]);
    } else {
      onFilterChange(formattedFilters);
    }
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className={styles.filterSection}>
      <div className={styles.filterRow}>
        <div className={styles.filterHeader}>
          <FaFilter className={styles.icon} />
          <h3 className={styles.title}>סינון בקשות נוכחות ממתינות לאישור</h3>
        </div>

        <div className={styles.filterControls}>
          <div className={styles.filterItem}>
            <label className={styles.label}>חודש</label>
            <ReactSelect
              options={getMonthOptions()}
              value={filters.month}
              onChange={(option) => handleFilterChange(option, "month")}
              placeholder="בחר חודש"
              components={{
                IndicatorSeparator: () => null,
              }}
              styles={selectStyle}
              menuPortalTarget={document.body}
              menuPosition={"fixed"}
              isRtl={true}
            />
          </div>

          <div className={styles.filterItem}>
            <label className={styles.label}>יום</label>
            <ReactSelect
              options={getDayOptions()}
              value={filters.day}
              onChange={(option) => handleFilterChange(option, "day")}
              placeholder="בחר יום"
              components={{
                IndicatorSeparator: () => null,
              }}
              styles={selectStyle}
              menuPortalTarget={document.body}
              menuPosition={"fixed"}
              isRtl={true}
            />
          </div>

          <div className={styles.filterItem}>
            <label className={styles.label}>שנה</label>
            <ReactSelect
              options={getYearOptions()}
              value={filters.year}
              onChange={(option) => handleFilterChange(option, "year")}
              placeholder="בחר שנה"
              components={{
                IndicatorSeparator: () => null,
              }}
              styles={selectStyle}
              menuPortalTarget={document.body}
              menuPosition={"fixed"}
              isRtl={true}
            />
          </div>

          <div className={styles.filterItem}>
            <label className={styles.label}>עובד</label>
            <ReactSelect
              options={workerOptions}
              value={filters.workerId}
              onChange={(option) => handleFilterChange(option, "workerId")}
              placeholder="כל העובדים"
              isDisabled={loadingWorkers}
              isLoading={loadingWorkers}
              components={{
                IndicatorSeparator: () => null,
              }}
              styles={selectStyle}
              menuPortalTarget={document.body}
              menuPosition={"fixed"}
              isRtl={true}
            />
          </div>

          <div className={styles.filterItem}>
            <label className={styles.label}>קבוצה</label>
            <ReactSelect
              options={groupOptions}
              value={filters.groupId}
              onChange={(option) => handleFilterChange(option, "groupId")}
              placeholder="כל הקבוצות"
              isDisabled={loadingGroups}
              isLoading={loadingGroups}
              components={{
                IndicatorSeparator: () => null,
              }}
              styles={selectStyle}
              menuPortalTarget={document.body}
              menuPosition={"fixed"}
              isRtl={true}
            />
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button
            className={`${styles.button} ${styles.reset}`}
            onClick={handleReset}
          >
            <FaSync className={styles.actionIcon} />
            איפוס
          </button>
          <button
            className={`${styles.button} ${styles.apply}`}
            onClick={handleApply}
            disabled={loading}
          >
            <FaSearch className={styles.actionIcon} />
            {loading ? "טוען..." : "החל פילטרים"}
          </button>
        </div>
      </div>
    </div>
  );
}
