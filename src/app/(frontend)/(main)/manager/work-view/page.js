"use client";
import { useState, useEffect } from "react";
import ReactSelect from "react-select";
import { format } from "date-fns";
import styles from "@/styles/screens/attendance-requests.module.scss";
import useProfile from "@/hooks/useProfile";
import getGroups from "@/app/(backend)/actions/groups/getGroups";
import { getAttendanceRequests } from "@/app/(backend)/actions/attendance/getAttendanceRequests";
import updateWorkingSchedule from "@/app/(backend)/actions/workers/updateWorkingSchedule";
import { updateApprovalStatus } from "@/app/(backend)/actions/attendance/updateApprovalStatus";

export default function WorkViewPage() {
  const { profile } = useProfile();
  const [groupOptions, setGroupOptions] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!profile?.manager?.id) return;
      const res = await getGroups({ managerId: profile.manager.id });
      if (res.status === 200) {
        setGroupOptions(res.data.map(g => ({ value: g.id, label: g.name })));
      }
    };
    fetchGroups();
  }, [profile]);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!selectedGroup) return;
      setLoading(true);
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      const res = await getAttendanceRequests({
        year,
        month,
        day,
        groupId: selectedGroup.value,
        approvalStatus: "ALL",
      });
      if (res.success) {
        setRecords(res.data);
      } else {
        setRecords([]);
      }
      setLoading(false);
    };
    fetchRecords();
  }, [selectedGroup, selectedDate]);

  const handleContainersChange = async (record, value) => {
    const numeric = Number(value);
    if (isNaN(numeric)) return;
    const dateStr = format(new Date(record.attendanceDate), "yyyy-MM-dd");
    await updateWorkingSchedule({
      workerId: record.workerId,
      date: dateStr,
      totalContainersFilled: numeric,
    });
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, totalContainersFilled: numeric } : r));
  };

  const handleStatusUpdate = async (recordId, status) => {
    const formData = new FormData();
    formData.append("attendanceId", recordId);
    formData.append("approvalStatus", status);
    const res = await updateApprovalStatus(formData);
    if (res.success) {
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, approvalStatus: status } : r));
    }
  };

  const totalContainers = records.reduce((sum, r) => sum + (r.totalContainersFilled || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>תצוגת עבודה</h1>
        <div className={styles.filterSection}>
          <div className={styles.filterItem} style={{ minWidth: "200px" }}>
            <ReactSelect
              options={groupOptions}
              value={selectedGroup}
              onChange={setSelectedGroup}
              placeholder="בחר קבוצה"
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              menuPortalTarget={document.body}
              isRtl
            />
          </div>
          <div className={styles.filterItem}>
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={e => setSelectedDate(new Date(e.target.value))}
              className={styles.dateInput}
            />
          </div>
        </div>
        <div className={styles.tableContainer}>
          {loading ? (
            <p>טוען...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>עובד</th>
                  <th>מיכלים</th>
                  <th>סטטוס</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>{r.worker ? `${r.worker.nameHe || ""} ${r.worker.surnameHe || ""}` : "-"}</td>
                    <td>
                      <input
                        type="number"
                        value={r.totalContainersFilled || 0}
                        onChange={e => handleContainersChange(r, e.target.value)}
                        className={styles.inputSmall}
                      />
                    </td>
                    <td>{r.approvalStatus === "APPROVED" ? "מאושר" : r.approvalStatus === "REJECTED" ? "נדחה" : "ממתין"}</td>
                    <td>
                      <button onClick={() => handleStatusUpdate(r.id, "APPROVED")}>אישור</button>
                      <button onClick={() => handleStatusUpdate(r.id, "REJECTED")}>דחייה</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>{"סה\"כ"}</td>
                  <td>{totalContainers}</td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
