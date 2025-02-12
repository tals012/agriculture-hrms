"use client";

import { memo } from "react";
import styles from "@/styles/containers/salary/table.module.scss";

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "-";
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
  }).format(amount);
};

const Table = memo(({ data }) => {
  if (!data?.workers?.length) return null;

  const totals = data.workers.reduce(
    (acc, worker) => ({
      totalHours: (acc.totalHours || 0) + (worker.totalHours || 0),
      totalWorkedDays: (acc.totalWorkedDays || 0) + (worker.workedDays || 0),
      totalSickDays: (acc.totalSickDays || 0) + (worker.sickDays || 0),
      totalContainers: (acc.totalContainers || 0) + (worker.totalContainers || 0),
      totalWage: (acc.totalWage || 0) + (worker.totalWage || 0),
      totalBonus: (acc.totalBonus || 0) + (worker.bonus || 0),
    }),
    {}
  );

  return (
    <div className={styles.container}>
      {/* <div className={styles.header}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>סה״כ שעות</span>
            <span>{totals.totalHours?.toFixed(2) || "-"}</span>
          </div>
          <div className={styles.stat}>
            <span>סה״כ ימי עבודה</span>
            <span>{totals.totalWorkedDays || "-"}</span>
          </div>
          <div className={styles.stat}>
            <span>סה״כ ימי מחלה</span>
            <span>{totals.totalSickDays || "-"}</span>
          </div>
          <div className={styles.stat}>
            <span>סה״כ מיכלים</span>
            <span>{totals.totalContainers || "-"}</span>
          </div>
              <div className={styles.stat}>
            <span>סה״כ שכר</span>
            <span>{formatCurrency(totals.totalWage)}</span>
              </div>
        </div>
      </div> */}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>שם העובד</th>
              <th>סה״כ שעות</th>
              <th>ימי עבודה</th>
              <th>ימי מחלה</th>
              <th>סה״כ מיכלים</th>
              <th>סה״כ שכר</th>
              <th>בונוס</th>
            </tr>
          </thead>
          <tbody>
            {data.workers.map((worker) => (
              <tr key={worker.id} className={styles.tableRow}>
                <td>{worker.name}</td>
                <td>{worker.totalHours?.toFixed(2) || "-"}</td>
                <td>{worker.workedDays || "-"}</td>
                <td>{worker.sickDays || "-"}</td>
                <td>{worker.totalContainers || "-"}</td>
                <td>{formatCurrency(worker.totalWage)}</td>
                <td>{formatCurrency(worker.bonus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data;
});

export default Table;
