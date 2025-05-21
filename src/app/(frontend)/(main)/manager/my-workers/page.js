"use client";

import { useEffect, useState } from "react";
import { getCookie } from "@/lib/getCookie";
import getProfile from "@/app/(backend)/actions/auth/getProfile";
import Spinner from "@/components/spinner";
import Image from "next/image";
import getManagerGroupMembers from "@/app/(backend)/actions/groups/getManagerGroupMembers";
import getGroups from "@/app/(backend)/actions/groups/getGroups";
import getAvailableWorkers from "@/app/(backend)/actions/groups/getAvailableWorkers";
import addWorkersToGroup from "@/app/(backend)/actions/groups/addWorkersToGroup";
import InitialsCircle from "@/components/initialsCircle";
import ReactSelect from "react-select";
import { toast } from "react-toastify";
import ProgressBar from "@/components/progressBar";
import sendBulkCredentialsSMS from "@/app/(backend)/actions/users/sendBulkCredentialsSMS";
import styles from "@/styles/screens/my-fields.module.scss";

export default function MyWorkersPage() {
  const selectStyle = {
    control: (baseStyles, state) => ({
      ...baseStyles,
      width: "100%",
      border: "1px solid #E6E6E6",
      height: "44px",
      fontSize: "14px",
      color: "#999FA5",
      borderRadius: "6px",
      background: "transparent",
    }),
    menu: (baseStyles) => ({
      ...baseStyles,
      position: "absolute",
      width: "100%",
      backgroundColor: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      zIndex: 99999,
    }),
    menuPortal: (baseStyles) => ({
      ...baseStyles,
      zIndex: 99999,
    }),
    multiValue: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: "#E6E6E6",
    }),
  };

  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [managerId, setManagerId] = useState(null);
  const [emptyState, setEmptyState] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedForSMS, setSelectedForSMS] = useState([]);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [showProgressModal, setShowProgressModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = getCookie("token");
      const { data } = await getProfile({ token });
      setManagerId(data.manager.id);
    };
    fetchData();
  }, []);

  const fetchWorkers = async () => {
    try {
      if (!managerId) return;

      const response = await getManagerGroupMembers({ managerId });
      if (response.status === 200) {
        if (response.data.length === 0) {
          setEmptyState(true);
          setWorkers([]);
        } else {
          setWorkers(response.data);
          setEmptyState(false);
        }

        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
      setWorkers([]);
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      if (!managerId) return;
      const response = await getGroups({ managerId });
      if (response.status === 200) {
        setGroups(response.data);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchAvailableWorkers = async () => {
    if (!selectedGroup?.value) return;

    try {
      setLoadingWorkers(true);
      const response = await getAvailableWorkers({
        groupId: selectedGroup.value,
      });
      if (response.status === 200) {
        setAvailableWorkers(response.data);
      } else {
        toast.error("שגיאה בטעינת העובדים הזמינים", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching available workers:", error);
      toast.error("שגיאה בטעינת העובדים הזמינים", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleAddWorkers = async () => {
    if (!selectedGroup?.value || selectedWorkers.length === 0) {
      toast.error("יש לבחור קבוצה ולפחות עובד אחד", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    try {
      setAdding(true);
      const response = await addWorkersToGroup({
        groupId: selectedGroup.value,
        workers: selectedWorkers,
      });

      if (response.status === 200) {
        toast.success("העובדים נוספו לקבוצה בהצלחה", {
          position: "top-center",
          autoClose: 3000,
        });
        setShowAddModal(false);
        setSelectedWorkers([]);
        setSelectedGroup(null);
        fetchWorkers();
      } else {
        toast.error(response.message || "שגיאה בהוספת העובדים", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error adding workers:", error);
      toast.error("שגיאה בהוספת העובדים", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWorker = (workerId) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  const handleToggleSMSWorker = (workerId) => {
    setSelectedForSMS((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  const handleSelectAllSMS = (checked) => {
    if (checked) {
      setSelectedForSMS(workers.map((w) => w.worker.id));
    } else {
      setSelectedForSMS([]);
    }
  };

  const handleSendCredentials = async () => {
    if (selectedForSMS.length === 0) return;
    const CHUNK_SIZE = 10;
    setShowProgressModal(true);
    setSendingSMS(true);
    for (let i = 0; i < selectedForSMS.length; i += CHUNK_SIZE) {
      const chunk = selectedForSMS.slice(i, i + CHUNK_SIZE);
      await sendBulkCredentialsSMS({ workerIds: chunk });
      const progress = Math.min(
        Math.round(((i + chunk.length) / selectedForSMS.length) * 100),
        100
      );
      setSendProgress(progress);
    }
    setSendingSMS(false);
    toast.success("ההודעות נשלחו", { position: "top-center", autoClose: 3000 });
  };

  const closeProgressModal = () => {
    setShowProgressModal(false);
    setSendProgress(0);
    setSelectedForSMS([]);
  };

  useEffect(() => {
    fetchWorkers();
  }, [managerId]);

  useEffect(() => {
    if (showAddModal) {
      fetchGroups();
    }
  }, [showAddModal, managerId]);

  useEffect(() => {
    if (selectedGroup?.value) {
      fetchAvailableWorkers();
    } else {
      setAvailableWorkers([]);
    }
  }, [selectedGroup]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size={40} color="#4f46e5" />
        <p>טוען את נתוני העובדים...</p>
      </div>
    );
  }

  // Group workers by their group for statistics
  const workersByGroup = workers.reduce((acc, worker) => {
    const groupId = worker.group.id;
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(worker);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <div className={styles.workersSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.leftSide}>
            <h2>העובדים שלי</h2>
            <div className={styles.stats}>
              <div className={styles.stat}>
                סה״כ עובדים: <span>{workers.length}</span>
              </div>
              <div className={styles.stat}>
                קבוצות: <span>{Object.keys(workersByGroup).length}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className={styles.addButton}
              onClick={handleSendCredentials}
              disabled={selectedForSMS.length === 0}
            >
              שלח פרטי התחברות
            </button>
            <button
              className={styles.addButton}
              onClick={() => setShowAddModal(true)}
            >
              הוסף עובדים
            </button>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <div className={styles.wrapper}>
            <div className={styles.tableContainer}>
              {emptyState ? (
                <div className={styles.emptyState}>
                  <Image
                    src="/assets/images/empty-fields.svg"
                    alt="No workers found"
                    width={200}
                    height={200}
                    priority
                  />
                  <h3>לא נמצאו עובדים</h3>
                  <p>נראה שאין לך עובדים מוקצים כרגע</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={
                            selectedForSMS.length === workers.length &&
                            workers.length > 0
                          }
                          onChange={(e) => handleSelectAllSMS(e.target.checked)}
                        />
                      </th>
                      <th>שם העובד</th>
                      <th>דרכון</th>
                      <th>קבוצה</th>
                      <th>שדה</th>
                      <th>תאריך התחלה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((member) => (
                      <tr
                        key={member.id}
                        className={member.isGroupLeader ? styles.leaderRow : ""}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedForSMS.includes(member.worker.id)}
                            onChange={() => handleToggleSMSWorker(member.worker.id)}
                          />
                        </td>
                        <td>
                          <p>
                            {member.worker.nameHe || member.worker.name}
                            {member.isGroupLeader && (
                              <span className={styles.leaderBadge}>
                                מנהל קבוצה
                              </span>
                            )}
                          </p>
                        </td>
                        <td>
                          <p>{member.worker.passport || "-"}</p>
                        </td>
                        <td>
                          <p>{member.group.name}</p>
                        </td>
                        <td>
                          <p>{member.group.field.name}</p>
                        </td>
                        <td>
                          <p>
                            {new Date(member.startDate).toLocaleDateString(
                              "he-IL",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>הוספת עובדים לקבוצה</h3>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedWorkers([]);
                  setSelectedGroup(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.groupSelect}>
                <label>בחר קבוצה:</label>
                <ReactSelect
                  options={groups.map((group) => ({
                    value: group.id,
                    label: `${group.name} - ${group.field.name}`,
                  }))}
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  placeholder="בחר קבוצה"
                  value={selectedGroup}
                  onChange={(option) => {
                    setSelectedGroup(option);
                    setSelectedWorkers([]);
                  }}
                  styles={selectStyle}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>

              {selectedGroup?.value &&
                (loadingWorkers ? (
                  <div className={styles.loading}>
                    <Spinner size={30} color="#4f46e5" />
                    <p>טוען עובדים זמינים...</p>
                  </div>
                ) : availableWorkers.length === 0 ? (
                  <div className={styles.noWorkers}>
                    אין עובדים זמינים להוספה
                  </div>
                ) : (
                  <div className={styles.workersList}>
                    {availableWorkers.map((worker) => (
                      <div
                        key={worker.id}
                        className={`${styles.workerItem} ${
                          selectedWorkers.includes(worker.id)
                            ? styles.selected
                            : ""
                        }`}
                        onClick={() => handleToggleWorker(worker.id)}
                      >
                        <div className={styles.workerInfo}>
                          <InitialsCircle name={worker.nameHe || worker.name} />
                          <div className={styles.workerDetails}>
                            <p className={styles.name}>
                              {worker.nameHe || worker.name}
                            </p>
                            <p className={styles.passport}>
                              {worker.passport || "-"}
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedWorkers.includes(worker.id)}
                          onChange={() => {}}
                        />
                      </div>
                    ))}
                  </div>
                ))}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedWorkers([]);
                  setSelectedGroup(null);
                }}
              >
                ביטול
              </button>
              <button
                className={styles.addButton}
                onClick={handleAddWorkers}
                disabled={
                  adding || selectedWorkers.length === 0 || !selectedGroup
                }
              >
                {adding ? (
                  <span className={styles.buttonContent}>
                    <Spinner size={14} color="#ffffff" />
                    מוסיף...
                  </span>
                ) : (
                  "הוסף עובדים"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {showProgressModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>שליחת פרטי התחברות</h3>
            </div>
            <div className={styles.modalBody}>
              <ProgressBar progress={sendProgress} />
              <p style={{ textAlign: "center", marginTop: 12 }}>{sendProgress}%</p>
            </div>
            <div className={styles.modalFooter}>
              {!sendingSMS && (
                <button className={styles.addButton} onClick={closeProgressModal}>
                  סגור
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
