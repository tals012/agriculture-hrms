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

const Table = memo(({ data, selectedWorkers, onWorkerSelect, onSelectAll }) => {
  if (!data?.workers?.length) return null;

  const handleSelectAll = (e) => {
    onSelectAll?.(e.target.checked);
  };

  const handleWorkerSelect = (workerId, e) => {
    onWorkerSelect?.(workerId, e.target.checked);
  };

  const allSelected = data.workers.length > 0 && 
    data.workers.every(worker => selectedWorkers.has(worker.id));

    console.log(data, "response");

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className={styles.checkbox}
                />
              </th>
              <th>שם העובד</th>
              <th>ימי עבודה</th>
              <th>ימי מחלה</th>
              <th>סה״כ מיכלים</th>
              <th>שעות רגילות</th>
              <th>שעות נוספות 125%</th>
              <th>שעות נוספות 150%</th>
              {/* <th>שכר בסיס</th> */}
              {/* <th>בונוס</th>
              <th>סה״כ שכר</th> */}
            </tr>
          </thead>
          <tbody>
            {data.workers.map((worker) => (
              <tr 
                key={worker.id} 
                className={`${styles.tableRow} ${selectedWorkers.has(worker.id) ? styles.selected : ''}`}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedWorkers.has(worker.id)}
                    onChange={(e) => handleWorkerSelect(worker.id, e)}
                    className={styles.checkbox}
                  />
                </td>
                <td>{worker.name}</td>
                <td>{worker.workedDays || "-"}</td>
                <td>{worker.sickDays || "-"}</td>
                <td>{formatNumber(worker.totalContainers, 0)}</td>
                <td>{formatNumber(worker.totalHours100, 2)}</td>
                <td>{formatNumber(worker.totalHours125, 2)}</td>
                <td>{formatNumber(worker.totalHours150, 2)}</td>
                {/* <td>{formatCurrency(worker.totalBaseSalary)}</td> */}
                {/* <td>{formatCurrency(worker.bonus)}</td> */}
                {/* <td>{formatCurrency((worker.totalSalary || 0))}</td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data && 
    prevProps.selectedWorkers === nextProps.selectedWorkers;
});

export default Table;
