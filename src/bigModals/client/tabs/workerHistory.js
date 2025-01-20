"use client";

import { useEffect, useState } from "react";
import { getWorkerHistory } from "@/app/(backend)/actions/clients/getWorkerHistory";
import { endWorkerAssignment } from "@/app/(backend)/actions/clients/endWorkerAssignment";
import Spinner from "@/components/spinner";
import { toast } from "react-toastify";
import Image from "next/image";
import { Plus } from "@/svgs/plus";
import { BsX } from "react-icons/bs";
import AssignWorkers from "@/smallModals/client/assignWorkers";
import styles from "@/styles/bigModals/client/tabs/workerHistory.module.scss";

const WorkerHistory = ({ clientId }) => {
  const [loading, setLoading] = useState(true);
  const [workerHistory, setWorkerHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [isAssignWorkersModalOpen, setIsAssignWorkersModalOpen] = useState(false);
  const [assignWorkerStatus, setAssignWorkerStatus] = useState(null);
  const [endingWorkerId, setEndingWorkerId] = useState(null);

  useEffect(() => {
    const fetchWorkerHistory = async () => {
      try {
        const response = await getWorkerHistory({ clientId });
        if (response?.status === 200) {
          setWorkerHistory(response.data);
        } else {
          toast.error(response?.message || "Failed to fetch worker history");
        }
      } catch (error) {
        console.error("Error fetching worker history:", error);
        toast.error("Failed to fetch worker history");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkerHistory();
  }, [clientId, assignWorkerStatus, endingWorkerId]);

  const handleEndAssignment = async (workerId) => {
    try {
      setEndingWorkerId(workerId);
      const res = await endWorkerAssignment({
        workerId,
        clientId,
        endDate: new Date()
      });

      if (res?.status === 200) {
        toast.success(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
      } else {
        if (res?.errors) {
          res.errors.forEach(error => {
            toast.error(`${error.field}: ${error.message}`, {
              position: "top-center",
              autoClose: 3000,
            });
          });
        } else {
          toast.error(res?.message || "Failed to end worker assignment", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error ending worker assignment:", error);
      toast.error("Failed to end worker assignment");
    } finally {
      setEndingWorkerId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1>היסטוריית עובדים</h1>
        <div className={styles.tabs}>
          <div className={`${styles.tab} ${styles.active}`}>
            <p>היסטוריית עובדים</p>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.search}>
            <div className={styles.searchInput}>
              <Image
                src="/assets/icons/search-2.svg"
                alt="search"
                width={16}
                height={16}
              />
              <input
                type="text"
                placeholder="חיפוש"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className={styles.button}>
              <Plus color="#ffffff" />
              הוספת עובדים
            </button>
          </div>
          <div className={styles.loading}>
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>היסטוריית עובדים</h1>

      <div className={styles.tabs}>
        <div className={`${styles.tab} ${styles.active}`}>
          <p>היסטוריית עובדים</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.search}>
          <div className={styles.searchInput}>
            <Image
              src="/assets/icons/search-2.svg"
              alt="search"
              width={16}
              height={16}
            />
            <input
              type="text"
              placeholder="חיפוש"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            className={styles.button}
            onClick={() => setIsAssignWorkersModalOpen(true)}
          >
            <Plus color="#ffffff" />
            הוספת עובדים
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th>עובד</th>
                <th>סטטוס</th>
                <th>טלפון</th>
                <th>דרכון</th>
                <th>תאריך התחלה</th>
                <th>תאריך סיום</th>
                <th>הערה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {workerHistory.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    <p>לא נמצאה היסטוריית עובדים</p>
                  </td>
                </tr>
              ) : (
                workerHistory.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <p>{record.worker.nameHe} {record.worker.surnameHe}</p>
                    </td>
                    <td>
                      <p>{record.worker.workerStatus}</p>
                    </td>
                    <td>
                      <p>{record.worker.primaryPhone}</p>
                    </td>
                    <td>
                      <p>{record.worker.passport}</p>
                    </td>
                    <td>
                      <p>{new Date(record.startDate).toLocaleDateString()}</p>
                    </td>
                    <td>
                      <p>{record.endDate ? new Date(record.endDate).toLocaleDateString() : "נוכחי"}</p>
                    </td>
                    <td>
                      <p>{record.note || "-"}</p>
                    </td>
                    <td>
                      {!record.endDate && (
                        <div className={styles.icons}>
                          {endingWorkerId === record.workerId ? (
                            <Spinner size={16} />
                          ) : (
                            <div 
                              onClick={() => handleEndAssignment(record.workerId)}
                              style={{ cursor: "pointer" }}
                            >
                              <BsX size={20} color="red" />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAssignWorkersModalOpen && (
        <AssignWorkers
          setModalOpen={setIsAssignWorkersModalOpen}
          setAssignStatus={setAssignWorkerStatus}
          clientId={clientId}
        />
      )}
    </div>
  );
};

export default WorkerHistory;
