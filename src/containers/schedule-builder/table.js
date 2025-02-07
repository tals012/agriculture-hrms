"use client";

import { useMemo } from "react";
import styles from "@/styles/containers/schedule-builder/table.module.scss";

const formatMinutesToTime = (minutes) => {
  if (!minutes && minutes !== 0) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

const Table = ({ data }) => {
  const { schedule, dailySchedule, metadata } = data || {};

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
            <span>{schedule.source}</span>
          </div>
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
                <td>{formatMinutesToTime(day.startTimeInMinutes)}</td>
                <td>{formatMinutesToTime(day.endTimeInMinutes)}</td>
                <td>
                  {day.breakTimeInMinutes 
                    ? `${day.breakTimeInMinutes} דקות${day.isBreakTimePaid ? " (בתשלום)" : ""}`
                    : "-"
                  }
                </td>
                <td>{day.totalWorkingHours?.toFixed(2) || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
