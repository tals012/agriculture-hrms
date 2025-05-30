"use client";

import { useEffect, useState } from "react";
import makeGroupLeader from "@/app/(backend)/actions/groups/makeGroupLeader";
import sendRequestForAttendance from "@/app/(backend)/actions/workers/sendRequestForAttendance";
import Spinner from "@/components/spinner";
import { toast } from "react-toastify";
import Image from "next/image";
import { Plus } from "@/svgs/plus";
import AddWorkersToGroup from "@/smallModals/groups/addWorkersToGroup";
import removeWorkersFromGroup from "@/app/(backend)/actions/groups/removeWorkersFromGroup";
import styles from "@/styles/bigModals/group/tabs/members.module.scss";
import getGroupById from "@/app/(backend)/actions/groups/getGroupById";
import { IoMdClose } from "react-icons/io";
import { FaEye, FaEyeSlash, FaUserEdit, FaSms } from "react-icons/fa";
import updateLeaderCredentials from "@/app/(backend)/actions/groups/updateLeaderCredentials";
import getUserById from "@/app/(backend)/actions/users/getUserById";
import sendCredentialsSMS from "@/app/(backend)/actions/users/sendCredentialsSMS";

const Members = ({ groupId, members, onUpdate }) => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [isAddWorkersModalOpen, setIsAddWorkersModalOpen] = useState(false);
  const [isLeaderCredentialsModalOpen, setIsLeaderCredentialsModalOpen] =
    useState(false);
  const [selectedLeader, setSelectedLeader] = useState(null);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    showPassword: false,
  });

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
      toast.error("עדכון מנהל הקבוצה נכשל", {
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
      toast.error("הסרת העובד מהקבוצה נכשלה");
    } finally {
      setLoading(false);
    }
  };

  const handleSendAttendanceRequest = async (workerId) => {
    try {
      setLoading(workerId);
      const res = await sendRequestForAttendance(workerId, groupId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error("Error sending attendance request:", error);
      toast.error("שליחת בקשת נוכחות נכשלה");
    } finally {
      setLoading(false);
    }
  };

  const openLeaderCredentialsModal = async (record) => {
    try {
      setSelectedLeader(record);
      setFetchingUser(true);
      setIsLeaderCredentialsModalOpen(true);

      // If user exists, fetch its details
      if (record.worker.userId) {
        // Fetch the full user details from the server
        const response = await getUserById({
          userId: record.worker.userId,
        });

        if (response.status === 200 && response.data) {
          // Update the record with the user data for future reference
          record.worker.user = response.data;

          setCredentials({
            username: response.data.username || "",
            password: "",
            showPassword: false,
          });
        } else {
          // Failed to fetch user data
          setCredentials({
            username: "",
            password: "",
            showPassword: false,
          });

          toast.warning("לא ניתן לטעון את פרטי המשתמש", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      } else {
        // Reset to defaults if no user is associated
        setCredentials({
          username: "",
          password: "",
          showPassword: false,
        });

        toast.warning("העובד אינו משויך למשתמש במערכת", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("שגיאה בטעינת פרטי המשתמש", {
        position: "top-center",
        autoClose: 3000,
      });

      setCredentials({
        username: "",
        password: "",
        showPassword: false,
      });
    } finally {
      setFetchingUser(false);
    }
  };

  const handleCredentialsUpdate = async () => {
    try {
      setLoading(true);

      if (!selectedLeader?.worker?.user?.id) {
        toast.error("מזהה משתמש לא נמצא", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      if (!credentials.username.trim()) {
        toast.error("יש להזין שם משתמש", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      const res = await updateLeaderCredentials({
        userId: selectedLeader.worker.user.id,
        username: credentials.username,
        password: credentials.password || undefined,
      });

      if (res.status === 200) {
        toast.success(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
        setIsLeaderCredentialsModalOpen(false);
        onUpdate(); // Refresh data
      } else {
        toast.error(res.message || "עדכון פרטי ההתחברות נכשל", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error updating credentials:", error);
      toast.error("עדכון פרטי ההתחברות נכשל", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendCredentialsSMS = async () => {
    try {
      if (!selectedLeader?.worker?.user?.id) {
        toast.error("מזהה משתמש לא נמצא", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      setLoading("sms");

      const res = await sendCredentialsSMS({
        userId: selectedLeader.worker.user.id,
      });

      if (res.status === 200) {
        toast.success(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
      } else {
        toast.error(res.message || "שליחת פרטי ההתחברות נכשלה", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error sending credentials SMS:", error);
      toast.error("שליחת פרטי ההתחברות נכשלה", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const [groupName, setGroupName] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await getGroupById({ groupId });
      if (res?.status === 200) {
        setGroupName(res.data.name);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.container}>
      <h1>{groupName}</h1>

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
                  <tr
                    key={record.id}
                    className={record.isGroupLeader ? styles.leaderRow : ""}
                  >
                    <td>
                      <p>
                        {record.worker.nameHe} {record.worker.surnameHe}
                        {record.isGroupLeader && (
                          <span className={styles.leaderBadge}>מנהל קבוצה</span>
                        )}
                      </p>
                    </td>
                    <td>
                      <p>{record.worker.primaryPhone}</p>
                    </td>
                    <td>
                      <p>{record.worker.passport}</p>
                    </td>
                    <td>
                      <p>
                        {new Date(record.startDate).toLocaleDateString(
                          "he-IL",
                          { day: "2-digit", month: "2-digit", year: "numeric" }
                        )}
                      </p>
                    </td>
                    <td>
                      <p>
                        {record.endDate
                          ? new Date(record.endDate).toLocaleDateString(
                              "he-IL",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )
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
                            onClick={() =>
                              handleSendAttendanceRequest(record.worker.id)
                            }
                            disabled={loading}
                          >
                            שלח בקשת נוכחות
                          </button>
                          <button
                            className={styles.closeButton}
                            onClick={() => handleRemoveWorker(record.worker.id)}
                            disabled={loading}
                          >
                            <IoMdClose color="#ffffff" fontSize={20} />
                          </button>
                        </div>
                      )}
                      {record.isGroupLeader && !loading && (
                        <div className={styles.actions}>
                          <button
                            className={styles.actionButton}
                            onClick={() => openLeaderCredentialsModal(record)}
                          >
                            <FaUserEdit style={{ marginLeft: "5px" }} />
                            פרטי התחברות
                          </button>
                          <button
                            className={styles.actionButton}
                            onClick={() =>
                              handleSendAttendanceRequest(record.worker.id)
                            }
                            disabled={loading}
                          >
                            שלח בקשת נוכחות
                          </button>
                          <button
                            className={styles.closeButton}
                            onClick={() => handleRemoveWorker(record.worker.id)}
                            disabled={loading}
                          >
                            <IoMdClose color="#ffffff" fontSize={20} />
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

      {isLeaderCredentialsModalOpen && selectedLeader && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>פרטי התחברות למנהל קבוצה</h2>
              <button
                className={styles.closeModalButton}
                onClick={() => setIsLeaderCredentialsModalOpen(false)}
              >
                <IoMdClose fontSize={24} />
              </button>
            </div>
            <div className={styles.modalContent}>
              <p className={styles.workerName}>
                {selectedLeader.worker.nameHe} {selectedLeader.worker.surnameHe}
              </p>

              {fetchingUser ? (
                <div className={styles.spinnerContainer}>
                  <Spinner size={30} />
                </div>
              ) : (
                <>
                  <div className={styles.formGroup}>
                    <label>שם משתמש</label>
                    <input
                      type="text"
                      value={credentials.username}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          username: e.target.value,
                        })
                      }
                      placeholder="שם משתמש"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>סיסמה חדשה</label>
                    <div className={styles.passwordContainer}>
                      <input
                        type={credentials.showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={(e) =>
                          setCredentials({
                            ...credentials,
                            password: e.target.value,
                          })
                        }
                        placeholder="סיסמה חדשה (השאר ריק אם אין שינוי)"
                        className={styles.input}
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() =>
                          setCredentials({
                            ...credentials,
                            showPassword: !credentials.showPassword,
                          })
                        }
                      >
                        {credentials.showPassword ? (
                          <FaEyeSlash fontSize={18} />
                        ) : (
                          <FaEye fontSize={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className={styles.infoBox}>
                    <p>
                      ברירת המחדל לסיסמה היא 10203040 עבור מנהלי קבוצות חדשים.
                    </p>
                    {selectedLeader?.worker?.user?.email && (
                      <p className={styles.emailInfo}>
                        אימייל: {selectedLeader.worker.user.email}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className={styles.modalActions}>
                <button
                  className={styles.smsButton}
                  onClick={handleSendCredentialsSMS}
                  disabled={
                    loading || fetchingUser || !selectedLeader?.worker?.user?.id
                  }
                >
                  {loading === "sms" ? (
                    <Spinner size={20} />
                  ) : (
                    <>
                      <FaSms style={{ marginLeft: "8px" }} />
                      שלח פרטים ב-SMS
                    </>
                  )}
                </button>
                <button
                  className={styles.saveButton}
                  onClick={handleCredentialsUpdate}
                  disabled={loading || fetchingUser}
                >
                  {loading === true ? <Spinner size={20} /> : "שמור שינויים"}
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => setIsLeaderCredentialsModalOpen(false)}
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
