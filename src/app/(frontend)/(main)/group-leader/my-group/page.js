"use client";

import { useEffect, useState } from "react";
import { getCookie } from "@/lib/getCookie";
import { getMyGroup } from "@/app/(backend)/actions/groups/getMyGroup";
import removeWorkersFromGroup from "@/app/(backend)/actions/groups/removeWorkersFromGroup";
import addWorkersToGroup from "@/app/(backend)/actions/groups/addWorkersToGroup";
import getAvailableWorkers from "@/app/(backend)/actions/groups/getAvailableWorkers";
import { format } from "date-fns";
import Image from "next/image";
import Chip from "@/components/chip";
import InitialsCircle from "@/components/initialsCircle";
import { toast } from "react-toastify";
import styles from "@/styles/screens/my-group.module.scss";
import Spinner from "@/components/spinner";
import useProfile from "@/hooks/useProfile";

export default function MyGroupPage() {
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [adding, setAdding] = useState(false);

  const { profile, loading: profileLoading } = useProfile();
  console.log(profile, "profile");

  const fetchGroup = async () => {
    try {
      const userId = getCookie("userId");
      if (!userId) return;

      const response = await getMyGroup({ userId });
      console.log(response, "response");
      if (response.status === 200) {
        setGroup(response.data);
      }
    } catch (error) {
      console.error("Error fetching group:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableWorkers = async () => {
    if (!group) return;

    try {
      setLoadingWorkers(true);
      const response = await getAvailableWorkers({ groupId: group.id });
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

  useEffect(() => {
    fetchGroup();
  }, []);

  const handleRemoveWorker = async (workerId) => {
    try {
      setRemoving(true);
      const response = await removeWorkersFromGroup({
        groupId: group.id,
        workers: [workerId],
      });

      if (response.status === 200) {
        toast.success("העובד הוסר מהקבוצה בהצלחה", {
          position: "top-center",
          autoClose: 3000,
        });
        fetchGroup(); // Refresh the group data
      } else {
        toast.error(response.message || "שגיאה בהסרת העובד", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error removing worker:", error);
      toast.error("שגיאה בהסרת העובד", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setRemoving(false);
    }
  };

  const handleAddWorkers = async () => {
    if (selectedWorkers.length === 0) {
      toast.error("יש לבחור לפחות עובד אחד", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    try {
      setAdding(true);
      const response = await addWorkersToGroup({
        groupId: group.id,
        workers: selectedWorkers,
      });

      if (response.status === 200) {
        toast.success("העובדים נוספו לקבוצה בהצלחה", {
          position: "top-center",
          autoClose: 3000,
        });
        setShowAddModal(false);
        setSelectedWorkers([]);
        fetchGroup();
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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size={40} color="#4f46e5" />
        <p>טוען את נתוני הקבוצה...</p>
      </div>
    );
  }

  if (!group) {
    return <div>No group found</div>;
  }

  // Filter out the group leader and get regular members
  const regularMembers = group.members.filter((m) => !m.isGroupLeader);
  const activeWorkers = regularMembers.filter(
    (m) => m.worker.workerStatus === "ACTIVE"
  );
  const inactiveWorkers = regularMembers.filter(
    (m) => m.worker.workerStatus !== "ACTIVE"
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>הקבוצה שלי</h1>
        <div className={styles.groupInfo}>
          <div className={styles.infoCard}>
            <div className={styles.label}>שם הקבוצה</div>
            <div className={styles.value}>{group.name}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.label}>שדה</div>
            <div className={styles.value}>{group.field.name}</div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.label}>לקוח</div>
            <div className={styles.value}>{group.field.client.name}</div>
          </div>
          {group.description && (
            <div className={styles.infoCard}>
              <div className={styles.label}>תיאור</div>
              <div className={styles.value}>{group.description}</div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.workersSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.leftSide}>
            <h2>עובדים בקבוצה</h2>
            <div className={styles.stats}>
              <div className={styles.stat}>
                סה״כ עובדים: <span>{regularMembers.length}</span>
              </div>
              <div className={styles.stat}>
                עובדים פעילים: <span>{activeWorkers.length}</span>
              </div>
            </div>
          </div>
          <button
            className={styles.addButton}
            onClick={() => {
              setShowAddModal(true);
              fetchAvailableWorkers();
            }}
          >
            הוסף עובדים
          </button>
        </div>

        <div className={styles.tableContainer}>
          <div className={styles.wrapper}>
            <div className={styles.tableContainer}>
              <table>
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" />
                    </th>
                    <th>שם העובד</th>
                    <th>טלפון</th>
                    <th>אימייל</th>
                    <th>דרכון</th>
                    <th>תאריך הצטרפות</th>
                    <th>סטטוס</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {regularMembers.length === 0 && (
                    <tr>
                      <td colSpan="8">
                        <p>אין עובדים בקבוצה</p>
                      </td>
                    </tr>
                  )}

                  {regularMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td>
                        <div className={styles.user}>
                          <InitialsCircle
                            name={`${
                              member.worker.name || member.worker.nameHe
                            } ${
                              member.worker.surname || member.worker.surnameHe
                            }`}
                          />
                          <p>
                            {member.worker.name || member.worker.nameHe}{" "}
                            {member.worker.surname || member.worker.surnameHe}
                          </p>
                        </div>
                      </td>
                      <td>
                        <p>{member.worker.primaryPhone || "-"}</p>
                      </td>
                      <td>
                        <p>{member.worker.email || "-"}</p>
                      </td>
                      <td>
                        <p>{member.worker.passport || "-"}</p>
                      </td>
                      <td>
                        <p>
                          {format(new Date(member.startDate), "dd-MM-yyyy")}
                        </p>
                      </td>
                      <td>
                        <Chip
                          text={
                            member.worker.workerStatus === "ACTIVE"
                              ? "פעיל"
                              : "לא פעיל"
                          }
                          bgColor={
                            member.worker.workerStatus === "ACTIVE"
                              ? "#EAF5F1"
                              : "#FDECEC"
                          }
                          textColor={
                            member.worker.workerStatus === "ACTIVE"
                              ? "#00563E"
                              : "#D8000C"
                          }
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => handleRemoveWorker(member.worker.id)}
                          disabled={removing}
                          className={styles.removeButton}
                        >
                          {removing ? (
                            <span className={styles.buttonContent}>
                              <Spinner size={14} color="#D8000C" />
                              מסיר...
                            </span>
                          ) : (
                            "הסר מהקבוצה"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                }}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {loadingWorkers ? (
                <div className={styles.loading}>
                  <Spinner size={30} color="#4f46e5" />
                  <p>טוען עובדים זמינים...</p>
                </div>
              ) : availableWorkers.length === 0 ? (
                <div className={styles.noWorkers}>אין עובדים זמינים להוספה</div>
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
                        <InitialsCircle
                          name={`${worker.name || worker.nameHe} ${
                            worker.surname || worker.surnameHe
                          }`}
                        />
                        <div className={styles.workerDetails}>
                          <p className={styles.name}>
                            {worker.name || worker.nameHe}{" "}
                            {worker.surname || worker.surnameHe}
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
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedWorkers([]);
                }}
              >
                ביטול
              </button>
              <button
                className={styles.addButton}
                onClick={handleAddWorkers}
                disabled={adding || selectedWorkers.length === 0}
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
    </div>
  );
}
