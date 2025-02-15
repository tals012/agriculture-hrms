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

const formatPercentage = (value) => {
  if (!value && value !== 0) return "-";
  return `${value.toFixed(1)}%`;
};

const Table = memo(({ data }) => {
  if (!data?.workers?.length) return null;

  const totals = data.workers.reduce(
    (acc, worker) => ({
      totalContainers: (acc.totalContainers || 0) + (worker.totalContainers || 0),
      containersWindow100: (acc.containersWindow100 || 0) + (worker.containersWindow100 || 0),
      containersWindow125: (acc.containersWindow125 || 0) + (worker.containersWindow125 || 0),
      containersWindow150: (acc.containersWindow150 || 0) + (worker.containersWindow150 || 0),
      totalWage: (acc.totalWage || 0) + (worker.totalWage || 0),
      bonus: (acc.bonus || 0) + (worker.bonus || 0),
      workedDays: (acc.workedDays || 0) + (worker.workedDays || 0),
      sickDays: (acc.sickDays || 0) + (worker.sickDays || 0),
    }),
    {}
  );

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>שם העובד</th>
              <th>ימי עבודה</th>
              <th>ימי מחלה</th>
              {/* <th>אחוז נוכחות</th> */}
              <th>סה״כ מיכלים</th>
              <th>מיכלים 100%</th>
              <th>מיכלים 125%</th>
              <th>מיכלים 150%</th>
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
                {/* <td>{formatPercentage(worker.attendancePercentage)}</td> */}
                <td>{formatNumber(worker.totalContainers, 0)}</td>
                <td>{formatNumber(worker.containersWindow100, 0)}</td>
                <td>{formatNumber(worker.containersWindow125, 0)}</td>
                <td>{formatNumber(worker.containersWindow150, 0)}</td>
                <td>{formatCurrency(worker.totalWage)}</td>
                <td>{formatCurrency(worker.bonus)}</td>
                <td>{formatCurrency((worker.totalWage || 0) + (worker.bonus || 0))}</td>
              </tr>
            ))}
            <tr className={styles.totalRow}>
              <td>סה״כ</td>
              <td>{totals.workedDays || "-"}</td>
              <td>{totals.sickDays || "-"}</td>
              {/* <td>-</td> */}
              <td>{formatNumber(totals.totalContainers, 0)}</td>
              <td>{formatNumber(totals.containersWindow100, 0)}</td>
              <td>{formatNumber(totals.containersWindow125, 0)}</td>
              <td>{formatNumber(totals.containersWindow150, 0)}</td>
              <td>{formatCurrency(totals.totalWage)}</td>
              <td>{formatCurrency(totals.bonus)}</td>
              <td>{formatCurrency((totals.totalWage || 0) + (totals.bonus || 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data;
});

export default Table;
