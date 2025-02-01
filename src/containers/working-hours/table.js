"use client";

import { useMemo, useState, useEffect } from "react";
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

  useEffect(() => {
    // For time fields, always show in HH:mm format
    if (type === "time") {
      setEditValue(formatMinutesToTime(value));
    } else {
      setEditValue(value);
    }
  }, [value, type]);

  const handleDoubleClick = () => {
    if (!disabled) {
      setEditing(true);
    }
  };

  const handleBlur = async () => {
    setEditing(false);
    if (editValue !== value) {
      let parsedValue = editValue;
      if (type === "time") {
        // Always send time values in HH:mm format
        if (/^\d+$/.test(editValue)) {
          // If user entered minutes, convert to HH:mm
          const minutes = Number(editValue);
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          parsedValue = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
        } else if (!editValue.includes(":")) {
          // If no colon, assume it's hours and add :00
          parsedValue = `${editValue.padStart(2, "0")}:00`;
        } else {
          // Ensure proper HH:mm format
          const [hours, minutes] = editValue.split(":").map(Number);
          parsedValue = `${hours.toString().padStart(2, "0")}:${(minutes || 0).toString().padStart(2, "0")}`;
        }
      } else if (type === "currency") {
        parsedValue = parseCurrency(editValue);
      } else if (type === "number") {
        parsedValue = Number(editValue);
      }
      await onSave(parsedValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    } else if (e.key === "Escape") {
      setEditValue(type === "time" ? formatMinutesToTime(value) : value);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={styles.editInput}
      />
    );
  }

  return (
    <div onDoubleClick={handleDoubleClick} className={styles.editableCell}>
      {type === "time" ? formatMinutesToTime(value) :
       type === "currency" ? formatCurrency(value) :
       value || "-"}
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

    try {
      setLoading(true);
      const dayData = dailySchedule.find(day => day.date === date);
      
      // Format time values to HH:mm
      const formatTimeValue = (minutes) => {
        if (!minutes && minutes !== 0) return null;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      };

      // Prepare base data with all required fields
      const updateData = {
        workerId,
        date: date.split('T')[0],
        startTimeInMinutes: formatTimeValue(dayData.startTimeInMinutes),
        endTimeInMinutes: formatTimeValue(dayData.endTimeInMinutes),
        breakTimeInMinutes: dayData.breakTimeInMinutes || 0,
        totalHoursWorked: dayData.totalWorkingHours || 0,
        totalContainersFilled: dayData.totalContainersFilled || 0,
        totalWage: dayData.totalWage || 0,
        isBreakTimePaid: dayData.isBreakTimePaid || false,
        status: dayData.status || 'WORKING'
      };

      // Update the specific field that was changed
      if (field === 'startTimeInMinutes' || field === 'endTimeInMinutes') {
        updateData[field] = value;
      } else if (field === 'totalWorkingHours') {
        updateData.totalHoursWorked = Number(value) || 0;
      } else if (field === 'breakTimeInMinutes' || field === 'totalContainersFilled' || field === 'totalWage') {
        updateData[field] = Number(value) || 0;
      }

      console.log('Updating schedule with data:', {
        ...updateData,
        originalDayData: dayData
      });

      const response = await updateWorkingSchedule(updateData);
      
      if (response.status === 200) {
        toast.success("נתונים עודכנו בהצלחה", {
          position: "top-center",
          autoClose: 3000,
        });
      } else {
        toast.error(response.message || "שגיאה בעדכון הנתונים", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating cell:", error);
      toast.error("שגיאה בעדכון הנתונים", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals for the stats
  const totals = dailySchedule.reduce((acc, day) => {
    if (day.scheduleSource === 'ATTENDANCE' && !day.isWeekend) {
      acc.totalContainers += day.totalContainersFilled || 0;
      acc.totalWage += day.totalWage || 0;
    }
    return acc;
  }, { totalContainers: 0, totalWage: 0 });

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
                <span>סה״כ מיכלים</span>
                <span>{totals.totalContainers}</span>
              </div>
              <div className={styles.stat}>
                <span>סה״כ שכר</span>
                <span>{formatCurrency(totals.totalWage)}</span>
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
              <th>סה״כ שעות</th>
              <th>מיכלים</th>
              <th>שכר</th>
              <th>מקור</th>
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
                <td>{day.isWeekend ? "סוף שבוע" : "יום עבודה"}</td>
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
                <td>
                  <EditableCell
                    value={day.breakTimeInMinutes}
                    type="number"
                    onSave={(value) => handleCellUpdate(day.date, 'breakTimeInMinutes', value)}
                    disabled={day.isWeekend}
                  />
                </td>
                <td>
                  <EditableCell
                    value={day.totalWorkingHours}
                    type="number"
                    onSave={(value) => handleCellUpdate(day.date, 'totalHoursWorked', value)}
                    disabled={day.isWeekend}
                  />
                </td>
                <td>
                  <EditableCell
                    value={day.totalContainersFilled}
                    type="number"
                    onSave={(value) => handleCellUpdate(day.date, 'totalContainersFilled', value)}
                    disabled={day.isWeekend}
                  />
                </td>
                <td>
                  <EditableCell
                    value={day.totalWage}
                    type="currency"
                    onSave={(value) => handleCellUpdate(day.date, 'totalWage', value)}
                    disabled={day.isWeekend}
                  />
                </td>
                <td>{getScheduleSourceText(day.scheduleSource)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
