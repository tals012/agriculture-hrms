"use client";

import { useEffect, useState, useCallback } from "react";
import ScreenHead from "@/components/screenHead";
import { ToastContainer, toast } from "react-toastify";
import Spinner from "@/components/spinner";
import { debounce } from "@/lib/debounce";
import { useRouter } from "next/navigation";
import { getCookie } from "@/lib/getCookie";
import styles from "@/styles/screens/working-hours.module.scss";
import ReactSelect from "react-select";
import { format, parse } from "date-fns";
import Image from "next/image";
import InitialsCircle from "@/components/initialsCircle";
import { FiEdit2 } from "react-icons/fi";
import getWorkingHours from "@/app/(backend)/actions/workers/getWorkingHours";
import getWorkers from "@/app/(backend)/actions/workers/getWorkers";
import editWorkingHours from "@/app/(backend)/actions/workers/editWorkingHours";

// Dummy data for development
const dummyData = [
  {
    id: 1,
    worker: {
      id: "w1",
      nameHe: "משה כהן",
    },
    attendance: {
      date: new Date("2024-01-30"),
      group: {
        name: "קבוצה א",
        field: {
          name: "שדה תפוחים צפון",
        }
      },
      combination: {
        harvestType: {
          name: "קטיף ידני"
        },
        species: {
          name: "תפוח עץ"
        }
      }
    },
    startTime: new Date("2024-01-30T08:00:00"),
    endTime: new Date("2024-01-30T16:00:00"),
    hoursWorked: 8,
    totalWage: 450.50,
    containersFilled: 16,
  },
  {
    id: 2,
    worker: {
      id: "w2",
      nameHe: "דוד לוי",
    },
    attendance: {
      date: new Date("2024-01-30"),
      group: {
        name: "קבוצה א",
        field: {
          name: "שדה תפוחים צפון",
        }
      },
      combination: {
        harvestType: {
          name: "קטיף ידני"
        },
        species: {
          name: "תפוח עץ"
        }
      }
    },
    startTime: new Date("2024-01-30T08:00:00"),
    endTime: new Date("2024-01-30T14:30:00"),
    hoursWorked: 6.5,
    totalWage: 325.75,
    containersFilled: 13,
  },
  {
    id: 3,
    worker: {
      id: "w3",
      nameHe: "יעקב ישראלי",
    },
    attendance: {
      date: new Date("2024-01-30"),
      group: {
        name: "קבוצה ב",
        field: {
          name: "שדה תפוזים דרום",
        }
      },
      combination: {
        harvestType: {
          name: "קטיף מכני"
        },
        species: {
          name: "תפוז"
        }
      }
    },
    startTime: new Date("2024-01-30T07:30:00"),
    endTime: new Date("2024-01-30T17:00:00"),
    hoursWorked: 9.5,
    totalWage: 522.25,
    containersFilled: 20,
  },
];

const FiltersRow = ({ filters, setFilters, handleSearch }) => {
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await getWorkers();
        if (response.status === 200) {
          const workerOptions = response.data.map(worker => ({
            value: worker.id,
            label: worker.nameHe || `${worker.name} ${worker.surname}`,
          }));
          setWorkers(workerOptions);
        }
      } catch (error) {
        console.error("Error fetching workers:", error);
      } finally {
        setWorkersLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  return (
    <div className={styles.filtersRow}>
      <div className={styles.filter}>
        <ReactSelect
          options={workers}
          value={filters.workerId ? { value: filters.workerId, label: filters.workerName } : null}
          onChange={(option) =>
            setFilters({ 
              ...filters, 
              workerId: option ? option.value : "",
              workerName: option ? option.label : ""
            })
          }
          placeholder="בחר עובד"
          isClearable
          isLoading={workersLoading}
        />
      </div>
      <button onClick={handleSearch} className={styles.searchButton}>
        חיפוש
      </button>
    </div>
  );
};

const EditableCell = ({ value, type, onSave, onChange, isEditing }) => {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleChange = (newValue) => {
    setEditValue(newValue);
    onChange(newValue);
  };

  const formatValue = (val) => {
    if (type === 'time' && val instanceof Date) {
      return format(new Date(val), "HH:mm");
    }
    if (type === 'date' && val instanceof Date) {
      return format(new Date(val), "dd/MM/yyyy");
    }
    if (type === 'number') {
      return typeof val === 'number' ? val.toFixed(2) : val;
    }
    return val;
  };

  if (!isEditing) {
    return (
      <div className={styles.editableCell}>
        <p>{formatValue(value)}</p>
        <FiEdit2 className={styles.editIcon} />
      </div>
    );
  }

  if (type === 'time') {
    return (
      <input
        type="time"
        value={format(new Date(editValue), "HH:mm")}
        onChange={(e) => {
          const [hours, minutes] = e.target.value.split(':');
          const date = new Date(editValue);
          date.setHours(parseInt(hours));
          date.setMinutes(parseInt(minutes));
          handleChange(date);
        }}
        className={styles.editInput}
      />
    );
  }

  if (type === 'number') {
    return (
      <input
        type="number"
        value={editValue}
        onChange={(e) => handleChange(e.target.value)}
        className={styles.editInput}
        step={0.01}
      />
    );
  }

  return null;
};

const WorkingHoursTable = ({ data, onUpdate }) => {
  const [editingRows, setEditingRows] = useState({});
  const [pendingChanges, setPendingChanges] = useState({});
  const [savingRows, setSavingRows] = useState({});

  const startEditing = (itemId) => {
    setEditingRows(prev => ({ ...prev, [itemId]: true }));
    setPendingChanges(prev => ({ ...prev, [itemId]: {} }));
  };

  const cancelEditing = (itemId) => {
    setEditingRows(prev => ({ ...prev, [itemId]: false }));
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[itemId];
      return newChanges;
    });
  };

  const handleFieldChange = (itemId, field, value) => {
    setPendingChanges(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const saveChanges = async (itemId) => {
    const changes = pendingChanges[itemId];
    if (!changes) return;

    setSavingRows(prev => ({ ...prev, [itemId]: true }));

    try {
      for (const [field, value] of Object.entries(changes)) {
        await onUpdate(itemId, field, value);
      }

      setEditingRows(prev => ({ ...prev, [itemId]: false }));
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[itemId];
        return newChanges;
      });
    } finally {
      setSavingRows(prev => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <div className={styles.tableContainer}>
      <table>
        <thead>
          <tr>
            <th>שם העובד</th>
            <th>תאריך</th>
            <th>שם השדה</th>
            <th>שם הקבוצה</th>
            <th>שעת התחלה</th>
            <th>שעת סיום</th>
            <th>סה״כ שעות</th>
            <th>סה״כ שכר</th>
            <th>מכלים שמולאו</th>
            <th>סוג קטיף</th>
            <th>מוצר</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan="12">
                <p>אין תוצאות</p>
              </td>
            </tr>
          )}

          {data.map((item, index) => {
            const isEditing = editingRows[item.id];
            const isSaving = savingRows[item.id];
            const rowChanges = pendingChanges[item.id] || {};

            return (
              <tr key={index}>
                <td>
                  <div className={styles.user}>
                    <InitialsCircle name={item.worker.nameHe} />
                    <p>{item.worker.nameHe}</p>
                  </div>
                </td>
                <td>
                  <p>{format(new Date(item.attendance.date), "dd/MM/yyyy")}</p>
                </td>
                <td>
                  <p>{item.attendance.group.field.name}</p>
                </td>
                <td>
                  <p>{item.attendance.group.name}</p>
                </td>
                <td>
                  <EditableCell
                    value={rowChanges.startTime || item.startTime}
                    type="time"
                    onChange={(value) => handleFieldChange(item.id, 'startTime', value)}
                    isEditing={isEditing}
                  />
                </td>
                <td>
                  <EditableCell
                    value={rowChanges.endTime || item.endTime}
                    type="time"
                    onChange={(value) => handleFieldChange(item.id, 'endTime', value)}
                    isEditing={isEditing}
                  />
                </td>
                <td>
                  <EditableCell
                    value={rowChanges.hoursWorked || item.hoursWorked}
                    type="number"
                    onChange={(value) => handleFieldChange(item.id, 'hoursWorked', parseFloat(value))}
                    isEditing={isEditing}
                  />
                </td>
                <td>
                  <EditableCell
                    value={rowChanges.totalWage || item.totalWage}
                    type="number"
                    onChange={(value) => handleFieldChange(item.id, 'totalWage', parseFloat(value))}
                    isEditing={isEditing}
                  />
                </td>
                <td>
                  <EditableCell
                    value={rowChanges.containersFilled || item.containersFilled}
                    type="number"
                    onChange={(value) => handleFieldChange(item.id, 'containersFilled', parseInt(value))}
                    isEditing={isEditing}
                  />
                </td>
                <td>
                  <p>{item.attendance.combination.harvestType.name}</p>
                </td>
                <td>
                  <p>{item.attendance.combination.species.name}</p>
                </td>
                <td>
                  {!isEditing ? (
                    <button 
                      className={styles.editButton}
                      onClick={() => startEditing(item.id)}
                    >
                      ערוך
                    </button>
                  ) : (
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.saveButton}
                        onClick={() => saveChanges(item.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <div className={styles.saveButtonContent}>
                            <Spinner size={14} color="#fff" />
                            <span>שומר...</span>
                          </div>
                        ) : (
                          'שמור'
                        )}
                      </button>
                      <button 
                        className={styles.cancelButton}
                        onClick={() => cancelEditing(item.id)}
                        disabled={isSaving}
                      >
                        בטל
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default function WorkingHours() {
  const router = useRouter();
  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    workerId: "",
    workerName: "",
  });

  const handleUpdate = async (itemId, field, value) => {
    try {
      const response = await editWorkingHours({
        id: itemId,
        field,
        value,
      });

      if (response.status === 200) {
        // Update local state with the updated record
        setData(prevData => 
          prevData.map(item => 
            item.id === itemId 
              ? response.data
              : item
          )
        );
        toast.success("נתונים עודכנו בהצלחה", {
          position: "top-center",
          autoClose: 3000,
          rtl: true
        });
      } else {
        toast.error(response.message || "שגיאה בעדכון הנתונים", {
          position: "top-center",
          autoClose: 3000,
          rtl: true
        });
      }
    } catch (error) {
      console.error("Error updating working hours:", error);
      toast.error("שגיאה בעדכון הנתונים", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
    }
  };

  const fetchData = async (currentFilters = {}) => {
    try {
      setLoading(true);
      const response = await getWorkingHours({
        workerId: currentFilters.workerId,
      });

      if (response.status === 200) {
        setData(response.data);
      } else {
        console.error("Error fetching working hours:", response.message);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching working hours:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchData = useCallback(
    debounce((currentFilters) => fetchData(currentFilters), 300),
    []
  );

  useEffect(() => {
    debouncedFetchData(filters);
  }, [filters, debouncedFetchData]);

  const handleSearch = () => {
    fetchData(filters);
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead
          title="שעות עבודה"
          desc="כאן תוכל לראות את שעות העבודה של העובדים"
        />
        <FiltersRow
          filters={filters}
          setFilters={setFilters}
          handleSearch={handleSearch}
        />
        {loading ? (
          <div className={styles.loader}>
            <Spinner size={30} />
          </div>
        ) : (
          <WorkingHoursTable 
            data={data} 
            onUpdate={handleUpdate}
          />
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
