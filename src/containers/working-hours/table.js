"use client";

import { useMemo, useState, useEffect, useRef, memo, useCallback } from "react";
import { toast } from "react-toastify";
import { getWorkingSchedule } from "@/app/(backend)/actions/workers/getWorkingSchedule";
import updateWorkingSchedule from "@/app/(backend)/actions/workers/updateWorkingSchedule";
import { getPricing } from "@/app/(backend)/actions/clients/getPricing";
import getWorkerById from "@/app/(backend)/actions/workers/getWorkerById";
import styles from "@/styles/containers/working-hours/table.module.scss";
import Select from "react-select";
import { FaCalendarTimes, FaClock, FaHourglassHalf, FaCheck, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";

// Status icon component
const StatusIcon = ({ status, approvalStatus, isWeekend }) => {
  if (approvalStatus === 'PENDING') {
    return (
      <div className={`${styles.statusIcon} ${styles.pending}`} title="ממתין לאישור">
        <FaHourglassHalf />
      </div>
    );
  }
  
  if (approvalStatus === 'REJECTED') {
    return (
      <div className={`${styles.statusIcon} ${styles.rejected}`} title="נדחה">
        <FaTimesCircle />
      </div>
    );
  }
  
  if (status && status !== 'WORKING') {
    return (
      <div className={`${styles.statusIcon} ${styles.notWorking}`} title="לא עובד">
        <FaClock />
      </div>
    );
  }
  
  if (status === 'WEEKEND' || (status === undefined && isWeekend)) {
    return (
      <div className={`${styles.statusIcon} ${styles.weekend}`} title="סוף שבוע">
        <FaCalendarTimes />
      </div>
    );
  }
  
  return null;
};

// Legend component
const Legend = () => {
  return (
    <div className={styles.legend}>
      <div className={styles.legendItem}>
        <div className={`${styles.icon} ${styles.pending}`}>
          <FaHourglassHalf />
        </div>
        <span className={styles.label}>ממתין לאישור</span>
      </div>
      <div className={styles.legendItem}>
        <div className={`${styles.icon} ${styles.rejected}`}>
          <FaTimesCircle />
        </div>
        <span className={styles.label}>נדחה</span>
      </div>
      <div className={styles.legendItem}>
        <div className={`${styles.icon} ${styles.notWorking}`}>
          <FaClock />
        </div>
        <span className={styles.label}>לא עובד</span>
      </div>
      <div className={styles.legendItem}>
        <div className={`${styles.icon} ${styles.weekend}`}>
          <FaCalendarTimes />
        </div>
        <span className={styles.label}>סוף שבוע</span>
      </div>
    </div>
  );
};

const formatMinutesToTime = (minutes) => {
  if (!minutes && minutes !== 0) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === "-") return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "-";
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
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

const STATUS_OPTIONS = [
  { value: 'WORKING', label: 'עובד' },
  { value: 'SICK_LEAVE', label: 'מחלה' },
  { value: 'DAY_OFF', label: 'חופש' },
  { value: 'HOLIDAY', label: 'חג' },
  { value: 'INTER_VISA', label: 'בין ויזות' },
  { value: 'NO_SCHEDULE', label: 'אין משמרת' },
  { value: 'ABSENT', label: 'נעדר' },
  { value: 'DAY_OFF_PERSONAL_REASON', label: 'חופש אישי' },
  { value: 'WEEKEND', label: 'סוף שבוע' },
  { value: 'ACCIDENT', label: 'תאונה' },
  { value: 'NOT_WORKING_BUT_PAID', label: 'לא עובד - משולם' }
];

const EditableCell = memo(({ value, type, onSave, disabled }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (type === "time") {
      setEditValue(formatMinutesToTime(value));
    } else if (type === "currency") {
      setEditValue(value ? value.toString() : "");
    } else if (type === "number") {
      setEditValue(value !== null && value !== undefined ? value.toString() : "");
    } else {
      setEditValue(value || "");
    }
  }, [value, type]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      setEditing(true);
    }
  }, [disabled]);

  const handleChange = useCallback((e) => {
    let newValue = e.target.value;

    if (type === "number") {
      newValue = newValue.replace(/[^0-9.]/g, "");
      const decimalPoints = newValue.match(/\./g);
      if (decimalPoints && decimalPoints.length > 1) {
        newValue = newValue.slice(0, newValue.lastIndexOf('.'));
      }
    } else if (type === "time") {
      newValue = newValue.replace(/[^0-9:]/g, "");
      if (newValue.length === 2 && !newValue.includes(":")) {
        newValue += ":";
      }
    }

    setEditValue(newValue);
  }, [type]);

  const handleBlur = useCallback(async () => {
    if (!editing) return;

    setEditing(false);
    if (editValue !== value?.toString()) {
      let parsedValue = editValue;

      if (type === "time") {
        if (/^\d{2}:\d{2}$/.test(editValue)) {
          const [hours, minutes] = editValue.split(":").map(Number);
          parsedValue = hours * 60 + minutes;
        } else {
          parsedValue = null;
        }
      } else if (type === "number") {
        parsedValue = editValue ? Number(editValue) : null;
        if (isNaN(parsedValue)) {
          parsedValue = null;
        }
      } else if (type === "currency") {
        parsedValue = editValue ? Number(editValue) : 0;
      }

      await onSave(parsedValue);
    }
  }, [editing, editValue, value, type, onSave]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.target.blur();
    } else if (e.key === "Escape") {
      setEditing(false);
      if (type === "time") {
        setEditValue(formatMinutesToTime(value));
      } else if (type === "number") {
        setEditValue(value !== null && value !== undefined ? value.toString() : "");
      } else {
        setEditValue(value || "");
      }
    }
  }, [type, value]);

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
            type === "time"
              ? "HH:mm"
              : type === "number"
              ? "מספר"
              : type === "currency"
              ? "סכום"
              : ""
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
      className={`${styles.editableCell} ${disabled ? styles.disabled : ""}`}
      title={disabled ? "לא ניתן לערוך בסוף שבוע" : "לחץ לעריכה"}
    >
      <div className={styles.editableCellContent}>
      {type === "time"
        ? formatMinutesToTime(value)
        : type === "currency"
        ? formatCurrency(value)
          : type === "number"
          ? (value !== null && value !== undefined ? Number(value).toFixed(2) : "-")
        : value || "-"}
      </div>
      {!disabled && <span className={styles.editIcon}>✎</span>}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value && 
         prevProps.disabled === nextProps.disabled;
});

const EditableRow = memo(({ day, weekDays, onSave, disabled, clientId }) => {
  const [pricingOptions, setPricingOptions] = useState([]);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(() => {
    return STATUS_OPTIONS.find(option => option.value === day.status) || STATUS_OPTIONS[0];
  });

  const isDisabled = useMemo(() => {
    return disabled || (day.status && day.status !== 'WORKING');
  }, [disabled, day.status]);

  const rowClassName = useMemo(() => {
    const classes = [styles.tableRow];
    if (day.isWeekend) {
      classes.push(styles.weekend);
    }
    if (day.status && day.status !== 'WORKING') {
      classes.push(styles.notWorking);
    }
    // We'll use icons instead of background color for pending status
    return classes.join(' ');
  }, [day.isWeekend, day.status]);

  useEffect(() => {
    const loadPricingOptions = async () => {
      if (clientId) {
        setLoading(true);
        try {
          const response = await getPricing({ clientId });
          if (response.status === 200) {
            const options = response.data.map(pricing => ({
              value: pricing.id,
              label: `${pricing.harvestType.name} - ${pricing.species.name} (${pricing.containerNorm} מיכלים)`,
              pricing
            }));
            setPricingOptions(options);
            
            if (day.combination) {
              const currentOption = options.find(opt => 
                opt.pricing.harvestType.name === day.combination.harvestType &&
                opt.pricing.species.name === day.combination.species
              );
              setSelectedPricing(currentOption);
            }
          }
        } catch (error) {
          console.error("Error loading pricing options:", error);
          toast.error("שגיאה בטעינת מחירונים");
        } finally {
          setLoading(false);
        }
      }
    };

    loadPricingOptions();
  }, [clientId, day.combination]);

  const handleContainersChange = useCallback(async (value) => {
    if (!isDisabled) {
      try {
        if (value !== null && !selectedPricing?.value) {
          toast.error("יש לבחור מחירון לפני הזנת מיכלים");
          return;
        }

        await onSave(day.date, { 
          totalContainersFilled: value !== null ? Number(value) : null,
          combinationId: selectedPricing?.value 
        });
      } catch (error) {
        console.error("Error updating containers:", error);
        toast.error("שגיאה בשמירת הנתונים");
      }
    }
  }, [isDisabled, onSave, day.date, selectedPricing]);

  const handleTimeChange = useCallback(async (field, value) => {
    if (!isDisabled) {
      try {
        if (!selectedPricing?.value) {
          toast.error("יש לבחור מחירון לפני עדכון שעות");
          return;
        }

        await onSave(day.date, { 
          [field]: value !== null ? Number(value) : null
        });
      } catch (error) {
        console.error("Error updating time:", error);
        toast.error("שגיאה בשמירת הנתונים");
      }
    }
  }, [isDisabled, onSave, day.date, selectedPricing]);

  const handlePricingChange = useCallback(async (selectedOption) => {
    if (!isDisabled) {
      try {
        setSelectedPricing(selectedOption);
        
        if (!selectedOption?.value) {
          await onSave(day.date, { 
            combinationId: null,
            totalContainersFilled: null
          });
          return;
        }

        if (!day.totalContainersFilled) {
          await onSave(day.date, { 
            combinationId: selectedOption?.value
          });
          return;
        }

        await onSave(day.date, { 
          combinationId: selectedOption?.value,
          totalContainersFilled: day.totalContainersFilled
        });
      } catch (error) {
        console.error("Error updating pricing:", error);
        toast.error("שגיאה בשמירת הנתונים");
      }
    }
  }, [isDisabled, onSave, day.date, day.totalContainersFilled]);

  const handleStatusChange = useCallback(async (selectedOption) => {
    if (!disabled) {
      try {
        setSelectedStatus(selectedOption);
        await onSave(day.date, { 
          status: selectedOption.value
        });
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("שגיאה בשמירת הנתונים");
      }
    }
  }, [disabled, onSave, day.date]);

  return (
    <tr className={rowClassName}>
      <td className={styles.statusCell}>
        <StatusIcon 
          status={day.status} 
          approvalStatus={day.approvalStatus || (day.attendance && day.attendance.approvalStatus)}
          isWeekend={day.isWeekend}
        />
      </td>
      <td>{new Date(day.date).getDate()}</td>
      <td>{weekDays[day.dayOfWeek]}</td>
      <td>
        <EditableCell
          value={day.startTimeInMinutes}
          type="time"
          onSave={(value) => handleTimeChange("startTimeInMinutes", value)}
          disabled={isDisabled || !selectedPricing}
        />
      </td>
      <td>
        <EditableCell
          value={day.endTimeInMinutes}
          type="time"
          onSave={(value) => handleTimeChange("endTimeInMinutes", value)}
          disabled={isDisabled || !selectedPricing}
        />
      </td>
      <td>{formatMinutesToTime(day.breakTimeInMinutes) || "-"}</td>
      <td>{!day.isWeekend ? (day.totalWorkingHoursWindow100 !== null && day.totalWorkingHoursWindow100 !== undefined ? day.totalWorkingHoursWindow100.toFixed(2) : "-") : "-"}</td>
      <td>{!day.isWeekend ? (day.totalWorkingHoursWindow125 !== null && day.totalWorkingHoursWindow125 !== undefined ? day.totalWorkingHoursWindow125.toFixed(2) : "-") : "-"}</td>
      <td>{!day.isWeekend ? (day.totalWorkingHoursWindow150 !== null && day.totalWorkingHoursWindow150 !== undefined ? day.totalWorkingHoursWindow150.toFixed(2) : "-") : "-"}</td>
      <td>{!day.isWeekend ? (day.totalWorkingHours !== null && day.totalWorkingHours !== undefined ? day.totalWorkingHours.toFixed(2) : "-") : "-"}</td>
      <td>
        <EditableCell
          value={day.totalContainersFilled}
          type="number"
          onSave={handleContainersChange}
          disabled={isDisabled || !selectedPricing}
        />
      </td>
      <td>
        <div className={styles.pricingSelect}>
          <Select
            value={selectedPricing}
            onChange={handlePricingChange}
            options={pricingOptions}
            isLoading={loading}
            placeholder="בחר מחירון"
            noOptionsMessage={() => "אין מחירונים זמינים"}
            isDisabled={isDisabled || loading}
            classNamePrefix="react-select"
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({
                ...base,
                zIndex: 9999
              })
            }}
          />
        </div>
      </td>
      <td>
        <div className={styles.statusSelect}>
          <Select
            value={selectedStatus}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            placeholder="בחר סטטוס"
            noOptionsMessage={() => "אין סטטוסים זמינים"}
            isDisabled={disabled}
            classNamePrefix="react-select"
            menuPortalTarget={document.body}
            styles={{
              menuPortal: (base) => ({
                ...base,
                zIndex: 9999
              })
            }}
          />
        </div>
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  return prevProps.day.date === nextProps.day.date && 
         prevProps.disabled === nextProps.disabled &&
         prevProps.clientId === nextProps.clientId;
});

const Table = memo(({ data, workerId, onDataUpdate }) => {
  const { schedule, dailySchedule, metadata } = data || {};
  const [loading, setLoading] = useState(false);
  const [workerClientId, setWorkerClientId] = useState(null);

  useEffect(() => {
    const fetchWorkerClient = async () => {
      if (workerId) {
        try {
          const response = await getWorkerById({ payload: { workerId } });
          if (response.status === 200 && response.data) {
            setWorkerClientId(response.data.currentClientId);
          }
        } catch (error) {
          console.error("Error fetching worker client:", error);
          toast.error("שגיאה בטעינת פרטי העובד");
        }
      }
    };

    fetchWorkerClient();
  }, [workerId]);

  const weekDays = useMemo(
    () => ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
    []
  );

  const handleRowUpdate = useCallback(async (date, updatedValues) => {
    if (loading) return;
    setLoading(true);

    try {
      const updateData = {
        workerId,
        date: date.split("T")[0],
        ...updatedValues,
      };

      const result = await updateWorkingSchedule(updateData);

      if (!result) {
        throw new Error("No response received from server");
      }

      if (result.status !== 200 || !result.data) {
        throw new Error(result.message || result.error || "Failed to update schedule");
      }

      if (onDataUpdate) {
        await onDataUpdate(result.data);
      }

      toast.success("העדכון בוצע בהצלחה");
      return result;
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error(error.message || "שגיאה בעדכון הנתונים");
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loading, workerId, onDataUpdate]);

  const totals = useMemo(() => {
    return dailySchedule?.reduce(
    (acc, day) => {
      if (day.scheduleSource === "ATTENDANCE" && !day.isWeekend) {
        acc.totalContainers += day.totalContainersFilled || 0;
          acc.totalHours100 += day.totalWorkingHoursWindow100 || 0;
          acc.totalHours125 += day.totalWorkingHoursWindow125 || 0;
          acc.totalHours150 += day.totalWorkingHoursWindow150 || 0;
      }
      return acc;
    },
    {
      totalContainers: 0,
      totalHours100: 0,
      totalHours125: 0,
      totalHours150: 0,
    }
  ) || {
    totalContainers: 0,
    totalHours100: 0,
    totalHours125: 0,
    totalHours150: 0,
  };
  }, [dailySchedule]);

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
            <span>{getScheduleSourceText(metadata.scheduleSource)}</span>
          </div>
          {metadata.hasAttendanceRecords && (
            <>
              <div className={styles.stat}>
                <span>שעות רגילות (100%)</span>
                <span>{totals.totalHours100 !== null && totals.totalHours100 !== undefined ? totals.totalHours100.toFixed(2) : "-"}</span>
              </div>
              <div className={styles.stat}>
                <span>שעות נוספות (125%)</span>
                <span>{totals.totalHours125 !== null && totals.totalHours125 !== undefined ? totals.totalHours125.toFixed(2) : "-"}</span>
              </div>
              <div className={styles.stat}>
                <span>שעות נוספות (150%)</span>
                <span>{totals.totalHours150 !== null && totals.totalHours150 !== undefined ? totals.totalHours150.toFixed(2) : "-"}</span>
              </div>
              <div className={styles.stat}>
                <span>סה״כ מיכלים</span>
                <span>{totals.totalContainers !== null && totals.totalContainers !== undefined ? totals.totalContainers : "-"}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add legend above the table */}
      <Legend />

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>סטטוס</th>
              <th>תאריך</th>
              <th>יום</th>
              <th>התחלה</th>
              <th>סיום</th>
              <th>הפסקה</th>
              <th>שעות רגילות</th>
              <th>שעות נוספות 125%</th>
              <th>שעות נוספות 150%</th>
              <th>סה״כ שעות</th>
              <th>מיכלים</th>
              <th>מחירון</th>
              <th>סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {dailySchedule?.map((day) => (
              <EditableRow
                key={day.date}
                day={day}
                weekDays={weekDays}
                onSave={handleRowUpdate}
                disabled={day.isWeekend}
                clientId={workerClientId}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.workerId === nextProps.workerId &&
    prevProps.data === nextProps.data
  );
});
export default Table;

