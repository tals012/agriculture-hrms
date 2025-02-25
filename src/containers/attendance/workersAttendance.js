"use client";
import { useEffect, useState } from "react";
import styles from "@/styles/containers/attendance/workersAttendance.module.scss";
import { BsArrowLeft, BsChevronDown } from "react-icons/bs";
import { toast } from "react-toastify";
import TextField from "@/components/textField";
import getGroupMembers from "@/app/(backend)/actions/groups/getGroupMembers";
import Spinner from "@/components/spinner";

const attendanceOptions = [
  { id: "absent", label: "לא נוכח" },
  { id: "0", label: "0 מכלים" },
  { id: "1", label: "1 מכלים" },
  { id: "2", label: "2 מכלים" },
  { id: "2.5", label: "2.5 מכלים" },
  { id: "custom", label: "מספר מכלים אחר" },
];

export default function WorkersAttendance({
  data,
  onUpdate,
  onStepChange,
  managerId,
}) {
  const [openWorkerId, setOpenWorkerId] = useState(null);
  const [workersAttendance, setWorkersAttendance] = useState(
    data?.workersAttendance || {}
  );
  const [customContainers, setCustomContainers] = useState(
    data?.customContainers || {}
  );

  // ! ============================
  // ! GROUP WORKERS
  // ! ============================
  const [groupWorkers, setGroupWorkers] = useState([]);
  const [groupWorkersLoading, setGroupWorkersLoading] = useState(true);

  const fetchGroupWorkers = async () => {
    try {
      if (!data.selectedGroup) return;

      const response = await getGroupMembers({
        groupId: data.selectedGroup.value,
      });
      console.log(response, "response");
      if (response.status === 200) {
        console.log(response.data, "response.data");
        if (response.data.length === 0) {
          setGroupWorkers([]);
        } else {
          setGroupWorkers(response.data);
        }

        setGroupWorkersLoading(false);
      }
    } catch (error) {
      console.error("Error fetching group workers:", error);
      setGroupWorkers([]);
      setGroupWorkersLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupWorkers();
  }, [data.selectedGroup]);

  // ! ============================
  // ! GROUP WORKERS END
  // ! ============================

  const handleWorkerClick = (workerId) => {
    setOpenWorkerId(openWorkerId === workerId ? null : workerId);
  };

  const handleAttendanceSelect = (workerId, optionId) => {
    const newAttendance = {
      ...workersAttendance,
      [workerId]: optionId,
    };
    setWorkersAttendance(newAttendance);
    onUpdate({
      workersAttendance: newAttendance,
      customContainers,
      groupWorkers
    });
  };

  const handleCustomContainers = (workerId, value) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, "");
    const newCustom = {
      ...customContainers,
      [workerId]: sanitizedValue,
    };
    setCustomContainers(newCustom);
    onUpdate({
      workersAttendance,
      customContainers: newCustom,
      groupWorkers
    });
  };

  const getDisplayLabel = (optionId, workerId) => {
    if (!optionId) return "";
    
    if (optionId === "custom" && customContainers[workerId]) {
      return `${customContainers[workerId]} מכלים`;
    }

    const option = attendanceOptions?.find((opt) => opt?.id === optionId);
    if (!option) return "";

    // For numeric options, show just the number with מכלים
    if (!isNaN(parseFloat(optionId))) {
      return `${optionId} מכלים`;
    }
    return option.label || "";
  };

  const handleNext = () => {
    const selectedWorkers = Object.keys(workersAttendance);
    if (selectedWorkers.length === 0) {
      toast.error("נא לבחור נוכחות לפחות עובד אחד", {
        position: "top-center",
        autoClose: 3000,
        rtl: true,
      });
      return;
    }

    // Validate custom containers input if selected
    const invalidWorker = selectedWorkers.find(
      (workerId) =>
        workersAttendance[workerId] === "custom" && !customContainers[workerId]
    );

    if (invalidWorker) {
      toast.error("נא להזין מספר מכלים", {
        position: "top-center",
        autoClose: 3000,
        rtl: true,
      });
      return;
    }

    onStepChange("issues");
  };

  useEffect(() => {
    if (groupWorkers.length > 0) {
      onUpdate({
        workersAttendance,
        customContainers,
        groupWorkers
      });
    }
  }, [groupWorkers]);

  if (groupWorkersLoading) {
    return (
      <div className={styles.container} style={{ justifyContent: "center" }}>
        <Spinner size={40} color="#000" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>סימון נוכחות עובדים</h2>

      <div className={styles.workersList}>
        {groupWorkers?.map((worker) => (
          <div key={worker.worker.id} className={styles.workerAccordion}>
            <div
              className={`${styles.workerHeader} ${
                openWorkerId === worker.worker.id ? styles.open : ""
              }`}
              onClick={() => handleWorkerClick(worker.worker.id)}
            >
              <div className={styles.workerInfo}>
                <span className={styles.name}>
                  {worker.worker.nameHe} {worker.worker.surnameHe}
                </span>
                <span className={styles.passport}>
                  {worker.worker.passport}
                </span>
              </div>
              <div className={styles.headerRight}>
                {workersAttendance[worker.worker.id] && (
                  <span className={styles.selectedOption}>
                    {getDisplayLabel(workersAttendance[worker.worker.id], worker.worker.id)}
                  </span>
                )}
                <BsChevronDown className={styles.chevron} />
              </div>
            </div>

            {openWorkerId === worker.worker.id && (
              <div className={styles.workerBody}>
                {attendanceOptions.map((option) => (
                  <label key={option.id} className={styles.optionItem}>
                    <input
                      type="radio"
                      name={`attendance-${worker.worker.id}`}
                      checked={workersAttendance[worker.worker.id] === option.id}
                      onChange={() =>
                        handleAttendanceSelect(worker.worker.id, option.id)
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
                {workersAttendance[worker.worker.id] === "custom" && (
                  <div className={styles.customInput}>
                    <TextField
                      label="מספר מכלים"
                      width="100%"
                      value={customContainers[worker.worker.id] || ""}
                      onChange={(e) =>
                        handleCustomContainers(worker.worker.id, e.target.value)
                      }
                      style={{
                        backgroundColor: "transparent",
                        border: "1px solid #E6E6E6",
                        borderRadius: "6px",
                        fontSize: "14px",
                        color: "#374151",
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button onClick={handleNext} className={styles.nextButton}>
          הבא
          <BsArrowLeft size={20} />
        </button>
      </div>
    </div>
  );
}
