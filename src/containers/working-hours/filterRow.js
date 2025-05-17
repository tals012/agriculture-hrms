"use client";

import { useState, useEffect } from "react";
import ReactSelect from "react-select";
import styles from "@/styles/containers/working-hours/filterRow.module.scss";
import getWorkers from "@/app/(backend)/actions/workers/getWorkers";

const months = [
  { value: 1, label: "ינואר" },
  { value: 2, label: "פברואר" },
  { value: 3, label: "מרץ" },
  { value: 4, label: "אפריל" },
  { value: 5, label: "מאי" },
  { value: 6, label: "יוני" },
  { value: 7, label: "יולי" },
  { value: 8, label: "אוגוסט" },
  { value: 9, label: "ספטמבר" },
  { value: 10, label: "אוקטובר" },
  { value: 11, label: "נובמבר" },
  { value: 12, label: "דצמבר" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => ({
  value: currentYear + i,
  label: String(currentYear + i),
}));

const createSelectStyle = (zIndex) => ({
  control: (baseStyles, state) => ({
    ...baseStyles,
    width: "100%",
    border: "1px solid #E6E6E6",
    height: "44px",
    fontSize: "14px",
    color: "#999FA5",
    borderRadius: "6px",
    background: "transparent",
    zIndex,
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: zIndex + 1000,
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: zIndex + 1000,
  }),
});

// Create styles with different z-index values
const monthSelectStyle = createSelectStyle(7000);
const yearSelectStyle = createSelectStyle(6000);
const workerSelectStyle = createSelectStyle(5000);

const FilterRow = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    month: {
      value: new Date().getMonth() + 1,
      label: months[new Date().getMonth()].label,
    },
    year: { value: currentYear, label: String(currentYear) },
    selectedWorker: null,
  });

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState({
    workers: false,
    submit: false,
  });

  // Fetch workers
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading((prev) => ({ ...prev, workers: true }));
      try {
        const response = await getWorkers();
        if (response.status === 200) {
          setWorkers(
            response.data.map((worker) => ({
              value: worker.id,
              label: `${worker.name} ${worker.surname || ""}`.trim(),
              data: worker,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching workers:", error);
      } finally {
        setLoading((prev) => ({ ...prev, workers: false }));
      }
    };

    fetchWorkers();
  }, []);

  const handleFilterChange = (value, field) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);

    // Only trigger API call if we have all required fields
    if (
      newFilters.month?.value &&
      newFilters.year?.value &&
      newFilters.selectedWorker?.value
    ) {
      handleSubmit(newFilters);
    }
  };

  const handleSubmit = async (currentFilters = filters) => {
    if (
      !currentFilters.month?.value ||
      !currentFilters.year?.value ||
      !currentFilters.selectedWorker?.value ||
      loading.submit
    ) {
      return;
    }

    setLoading((prev) => ({ ...prev, submit: true }));
    try {
      await onFilterChange({
        month: currentFilters.month.value,
        year: currentFilters.year.value,
        workerId: currentFilters.selectedWorker.value,
      });
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <div className={styles.dateFilters}>
          <ReactSelect
            options={months}
            value={filters.month}
            onChange={(option) => handleFilterChange(option, "month")}
            placeholder="חודש"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={monthSelectStyle}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
          />
          <ReactSelect
            options={years}
            value={filters.year}
            onChange={(option) => handleFilterChange(option, "year")}
            placeholder="שנה"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={yearSelectStyle}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
          />
        </div>

        <div className={styles.entityFilters}>
          <ReactSelect
            options={workers}
            isLoading={loading.workers}
            value={filters.selectedWorker}
            onChange={(option) => handleFilterChange(option, "selectedWorker")}
            placeholder="בחר עובד"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={workerSelectStyle}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
          />
        </div>

        <button
          className={styles.submitButton}
          onClick={() => handleSubmit()}
          disabled={loading.submit || !filters.selectedWorker}
        >
          {loading.submit ? "טוען..." : "הצג"}
        </button>
      </div>
    </div>
  );
};

export default FilterRow;
