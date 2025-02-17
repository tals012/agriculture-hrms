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

const formatNumber = (number, decimals = 2) => {
  if (!number && number !== 0) return "-";
  return number.toFixed(decimals);
};

const Table = memo(({ data }) => {
  if (!data?.workers?.length) return null;

  console.log(data, "salary data");

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>שם העובד</th>
              <th>ימי עבודה</th>
              <th>ימי מחלה</th>
              <th>סה״כ מיכלים</th>
              <th>שעות רגילות</th>
              <th>שעות נוספות 125%</th>
              <th>שעות נוספות 150%</th>
              <th>שכר בסיס</th>
              <th>בונוס</th>
              <th>סה״כ שכר</th>
            </tr>
          </thead>
          <tbody>
            {data.workers.map((worker) => (
              <tr key={worker.id} className={styles.tableRow}>
                <td>{worker.name}</td>
                <td>{worker.workedDays || "-"}</td>
                <td>{worker.sickDays || "-"}</td>
                <td>{formatNumber(worker.totalContainers, 0)}</td>
                <td>{formatNumber(worker.totalHours100, 2)}</td>
                <td>{formatNumber(worker.totalHours125, 2)}</td>
                <td>{formatNumber(worker.totalHours150, 2)}</td>
                <td>{formatCurrency(worker.totalWage)}</td>
                <td>{formatCurrency(worker.bonus)}</td>
                <td>{formatCurrency((worker.totalWage || 0) + (worker.bonus || 0))}</td>
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
