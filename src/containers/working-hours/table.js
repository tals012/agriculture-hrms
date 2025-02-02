"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import styles from "@/styles/containers/working-hours/table.module.scss";
import { toast } from "react-toastify";
import updateWorkingSchedule from "@/app/(backend)/actions/workers/updateWorkingSchedule";

const formatMinutesToTime = (minutes) => {
  if (!minutes && minutes !== 0) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === "-") return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "-";
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
  }).format(amount);
};

const parseCurrency = (currencyStr) => {
  if (!currencyStr || currencyStr === "-") return null;
  return Number(currencyStr.replace(/[^0-9.-]+/g, ""));
};

const getScheduleSourceText = (source) => {
  switch (source) {
    case "WORKER":
      return "אישי";
    case "GROUP":
      return "קבוצה";
    case "FIELD":
      return "שדה";
    case "CLIENT":
      return "לקוח";
    case "ORGANIZATION":
      return "ארגון";
    case "ATTENDANCE":
      return "נוכחות בפועל";
    default:
      return source;
  }
};

const EditableCell = ({ value, type, onSave, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (type === "time") {
      setEditValue(formatMinutesToTime(value));
    } else if (type === "currency") {
      setEditValue(value ? value.toString() : "");
    } else {
      setEditValue(value || "");
    }
  }, [value, type]);

  const handleClick = () => {
    if (!disabled) {
      setEditing(true);
    }
  };

  const handleChange = (e) => {
    let newValue = e.target.value;
    
    // Handle special cases for different types
    if (type === "number") {
      // Allow only numbers and empty string
      newValue = newValue.replace(/[^0-9]/g, '');
    } else if (type === "time") {
      // Allow numbers, colon, and empty string
      newValue = newValue.replace(/[^0-9:]/g, '');
      // Auto-add colon after 2 digits if not present
      if (newValue.length === 2 && !newValue.includes(':')) {
        newValue += ':';
      }
    }
    
    setEditValue(newValue);
  };

  const handleBlur = async () => {
    if (!editing) return;
    
    setEditing(false);
    if (editValue !== value) {
      let parsedValue = editValue;
      
      if (type === "time") {
        // Handle different time input formats
        if (/^\d{1,2}:\d{2}$/.test(editValue)) {
          parsedValue = editValue.padStart(5, '0');
        } else if (/^\d{1,4}$/.test(editValue)) {
          const minutes = parseInt(editValue);
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          parsedValue = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        }
      } else if (type === "currency" || type === "number") {
        parsedValue = editValue ? Number(editValue) : 0;
      }
      
      await onSave(parsedValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    } else if (e.key === "Escape") {
      setEditing(false);
      if (type === "time") {
        setEditValue(formatMinutesToTime(value));
      } else {
        setEditValue(value || "");
      }
    } else if (type === "time" && e.key === ":") {
      // Prevent multiple colons in time input
      if (editValue.includes(':')) {
        e.preventDefault();
      }
    }
  };

  if (editing) {
    return (
      <div className={styles.editableCellWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className={styles.editInput}
          placeholder={
            type === "time" ? "HH:mm" :
            type === "number" ? "מספר" :
            type === "currency" ? "סכום" : ""
          }
        />
        <div className={styles.editingHint}>
          {type === "time" ? "לחץ Enter לשמירה" : ""}
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick} 
      className={`${styles.editableCell} ${disabled ? styles.disabled : ''}`}
      title={disabled ? "לא ניתן לערוך בסוף שבוע" : "לחץ לעריכה"}
    >
      {type === "time" ? formatMinutesToTime(value) :
       type === "currency" ? formatCurrency(value) :
       value || "-"}
      {!disabled && <span className={styles.editIcon}>✎</span>}
    </div>
  );
};

const Table = ({ data, workerId }) => {
  const { schedule, dailySchedule, metadata } = data || {};
  const [loading, setLoading] = useState(false);

  const weekDays = useMemo(() => [
    "ראשון",
    "שני",
    "שלישי",
    "רביעי",
    "חמישי",
    "שישי",
    "שבת",
  ], []);

  if (!dailySchedule) return null;

  const handleCellUpdate = async (date, field, value) => {
    if (loading) return;
    setLoading(true);

    try {
      // Convert time fields from HH:mm to minutes
      let processedValue = value;
      if (field === 'startTimeInMinutes' || field === 'endTimeInMinutes') {
        // Convert HH:mm to minutes
        const [hours, minutes] = value.split(':').map(Number);
        processedValue = hours * 60 + minutes;
      } else if (field === 'breakTimeInMinutes') {
        processedValue = Number(value);
      }

      const updateData = {
        workerId,
        date: date.split('T')[0],
        [field]: processedValue
      };

      
      const result = await updateWorkingSchedule(updateData);

      if (result.status !== 200) {
        throw new Error(result.error || 'Failed to update schedule');
      }

      toast.success('העדכון בוצע בהצלחה');
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error(error.message || 'שגיאה בעדכון הנתונים');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals for the stats
  const totals = dailySchedule.reduce((acc, day) => {
    if (day.scheduleSource === 'ATTENDANCE' && !day.isWeekend) {
      acc.totalContainers += day.totalContainersFilled || 0;
      acc.totalHours100 += day.totalHoursWorkedWindow100 || 0;
      acc.totalHours125 += day.totalHoursWorkedWindow125 || 0;
      acc.totalHours150 += day.totalHoursWorkedWindow150 || 0;
    }
    return acc;
  }, { 
    totalContainers: 0,
    totalHours100: 0,
    totalHours125: 0,
    totalHours150: 0
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>סה״כ ימים</span>
            <span>{metadata.totalDays}</span>
          </div>
          <div className={styles.stat}>
            <span>ימי עבודה</span>
            <span>{metadata.workingDays}</span>
          </div>
          <div className={styles.stat}>
            <span>סופי שבוע</span>
            <span>{metadata.weekendDays}</span>
          </div>
          <div className={styles.stat}>
            <span>מקור לוח זמנים</span>
            <span>{getScheduleSourceText(metadata.scheduleSource)}</span>
          </div>
          {metadata.hasAttendanceRecords && (
            <>
              <div className={styles.stat}>
                <span>שעות רגילות (100%)</span>
                <span>{totals.totalHours100.toFixed(2)}</span>
              </div>
              <div className={styles.stat}>
                <span>שעות נוספות (125%)</span>
                <span>{totals.totalHours125.toFixed(2)}</span>
              </div>
              <div className={styles.stat}>
                <span>שעות נוספות (150%)</span>
                <span>{totals.totalHours150.toFixed(2)}</span>
              </div>
              <div className={styles.stat}>
                <span>סה״כ מיכלים</span>
                <span>{totals.totalContainers}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>תאריך</th>
              <th>יום</th>
              <th>סוג</th>
              <th>שעת התחלה</th>
              <th>שעת סיום</th>
              <th>זמן הפסקה</th>
              <th>100%</th>
              <th>125%</th>
              <th>150%</th>
              <th>סה״כ שעות</th>
              <th>מיכלים</th>
              {/* <th>מקור</th> */}
            </tr>
          </thead>
          <tbody>
            {dailySchedule.map((day) => (
              <tr 
                key={day.date}
                className={day.isWeekend ? styles.weekend : ""}
              >
                <td>{new Date(day.date).toLocaleDateString("he-IL")}</td>
                <td>{weekDays[day.dayOfWeek]}</td>
                <td>
                  <span className={day.isWeekend ? styles.weekendBadge : styles.workdayBadge}>
                    {day.isWeekend ? "סוף שבוע" : "יום עבודה"}
                  </span>
                </td>
                <td>
                  <EditableCell
                    value={day.startTimeInMinutes}
                    type="time"
                    onSave={(value) => handleCellUpdate(day.date, 'startTimeInMinutes', value)}
                    disabled={day.isWeekend}
                  />
                </td>
                <td>
                  <EditableCell
                    value={day.endTimeInMinutes}
                    type="time"
                    onSave={(value) => handleCellUpdate(day.date, 'endTimeInMinutes', value)}
                    disabled={day.isWeekend}
                  />
                </td>
                <td>{formatMinutesToTime(day.breakTimeInMinutes) || "-"}</td>
                <td>{!day.isWeekend ? (day.totalWorkingHoursWindow100?.toFixed(2)) : "-"}</td>
                <td>{!day.isWeekend ? (day.totalWorkingHoursWindow125?.toFixed(2)) : "-"}</td>
                <td>{!day.isWeekend ? (day.totalWorkingHoursWindow150?.toFixed(2)) : "-"}</td>
                <td>{!day.isWeekend ? (day.totalWorkingHours?.toFixed(2)) : "-"}</td>
                <td>
                  <EditableCell
                    value={day.totalContainersFilled}

                    type="number"
                    onSave={(value) => handleCellUpdate(day.date, 'totalContainersFilled', value)}
                    disabled={day.isWeekend}
                  />
                </td>
                {/* <td>
                  <span className={styles.sourceBadge}>
                    {getScheduleSourceText(day.scheduleSource)}
                  </span>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
