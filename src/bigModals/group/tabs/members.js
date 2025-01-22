"use client";

import { useState } from "react";
import makeGroupLeader from "@/app/(backend)/actions/groups/makeGroupLeader";
import Spinner from "@/components/spinner";
import { toast } from "react-toastify";
import Image from "next/image";
import { Plus } from "@/svgs/plus";
import AddWorkersToGroup from "@/smallModals/groups/addWorkersToGroup";
import removeWorkersFromGroup from "@/app/(backend)/actions/groups/removeWorkersFromGroup";
import styles from "@/styles/bigModals/group/tabs/members.module.scss";

const Members = ({ groupId, members, onUpdate }) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAddWorkersModalOpen, setIsAddWorkersModalOpen] = useState(false);

  const filteredMembers = members.filter((record) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const nameMatch = record.worker.nameHe?.toLowerCase().includes(searchLower);
    const surnameMatch = record.worker.surnameHe
      ?.toLowerCase()
      .includes(searchLower);
    const phoneMatch = record.worker.primaryPhone
      ?.toLowerCase()
      .includes(searchLower);
    const passportMatch = record.worker.passport
      ?.toLowerCase()
      .includes(searchLower);
    return nameMatch || surnameMatch || phoneMatch || passportMatch;
  });

  const handleMakeLeader = async (workerId) => {
    try {
      setLoading(workerId);
      const res = await makeGroupLeader({
        groupId,
        workerId,
      });

      if (res.status === 200) {
        toast.success(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
        // Trigger parent component to refresh data
        if (onUpdate) onUpdate();
      } else {
        toast.error(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error making group leader:", error);
      toast.error("Failed to update group leader", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWorker = async (workerId) => {
    try {
      setLoading(workerId);
      const res = await removeWorkersFromGroup({
        groupId,
        workers: [workerId],
      });
      if (res?.status === 200) {
        toast.success(res.message);
        onUpdate();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error("Error removing worker from group:", error);
      toast.error("Failed to remove worker from group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>משתתפים</h1>

      <div className={styles.tabs}>
        <div className={`${styles.tab} ${styles.active}`}>
          <p>משתתפים</p>
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
            onClick={() => setIsAddWorkersModalOpen(true)}
          >
            <Plus color="#ffffff" />
            הוספת משתתפים
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th>עובד</th>
                <th>טלפון</th>
                <th>דרכון</th>
                <th>תאריך התחלה</th>
                <th>תאריך סיום</th>
                <th>מנהל קבוצה</th>
                <th style={{ width: "350px", minWidth: "350px" }}>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    <p>לא נמצאה היסטוריית עובדים</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <p>
                        {record.worker.nameHe} {record.worker.surnameHe}
                      </p>
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
                      <p>
                        {record.endDate
                          ? new Date(record.endDate).toLocaleDateString()
                          : "נוכחי"}
                      </p>
                    </td>
                    <td>
                      <p>{record.isGroupLeader ? "כן" : "לא"}</p>
                    </td>
                    <td style={{ width: "350px", minWidth: "350px" }}>
                      {!record.isGroupLeader && !loading && (
                        <div className={styles.actions}>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleMakeLeader(record.worker.id)}
                            disabled={loading}
                          >
                            הפוך למנהל קבוצה
                          </button>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleRemoveWorker(record.worker.id)}
                            disabled={loading}
                          >
                            הסרת משתתפ
                          </button>
                        </div>
                      )}
                      {loading === record.worker.id && (
                        <div className={styles.spinnerContainer}>
                          <Spinner size={20} />
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

      {isAddWorkersModalOpen && (
        <AddWorkersToGroup
          setModalOpen={setIsAddWorkersModalOpen}
          groupId={groupId}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

export default Members;
