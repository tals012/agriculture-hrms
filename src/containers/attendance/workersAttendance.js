"use client";
import { useState } from "react";
import styles from "@/styles/containers/attendance/workersAttendance.module.scss";
import { BsArrowLeft, BsChevronDown } from "react-icons/bs";
import { toast } from "react-toastify";
import TextField from "@/components/textField";

const attendanceOptions = [
  { id: 'present', label: 'נוכח' },
  { id: 'absent', label: 'לא נוכח' },
  { id: 'day-off', label: 'יום חופש' },
  { id: '0', label: '0 מכלים' },
  { id: '1', label: '1 מכלים' },
  { id: '2', label: '2 מכלים' },
  { id: '2.5', label: '2.5 מכלים' },
  { id: 'custom', label: 'מספר מכלים אחר' },
];

export default function WorkersAttendance({ data, onUpdate, onStepChange }) {
  // TODO: This should come from API based on selected group
  const workers = [
    { id: 1, firstName: "John", lastName: "Doe", passport: "AB123456" },
    { id: 2, firstName: "Jane", lastName: "Smith", passport: "CD789012" },
    { id: 3, firstName: "Bob", lastName: "Johnson", passport: "EF345678" },
  ];

  const [openWorkerId, setOpenWorkerId] = useState(null);
  const [workersAttendance, setWorkersAttendance] = useState(data?.workersAttendance || {});
  const [customContainers, setCustomContainers] = useState(data?.customContainers || {});

  const handleWorkerClick = (workerId) => {
    setOpenWorkerId(openWorkerId === workerId ? null : workerId);
  };

  const handleAttendanceSelect = (workerId, optionId) => {
    setWorkersAttendance(prev => {
      const newAttendance = {
        ...prev,
        [workerId]: optionId
      };
      onUpdate({ 
        workersAttendance: newAttendance,
        customContainers
      });
      return newAttendance;
    });
  };

  const handleCustomContainers = (workerId, value) => {
    // Only allow numbers and decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    
    setCustomContainers(prev => {
      const newCustom = {
        ...prev,
        [workerId]: sanitizedValue
      };
      onUpdate({ 
        workersAttendance,
        customContainers: newCustom
      });
      return newCustom;
    });
  };

  const getDisplayLabel = (optionId, workerId) => {
    if (optionId === 'custom' && customContainers[workerId]) {
      return `${customContainers[workerId]} מכלים`;
    }

    const option = attendanceOptions.find(opt => opt.id === optionId);
    if (!option) return '';
    
    // For numeric options, show just the number with מכלים
    if (!isNaN(parseFloat(optionId))) {
      return `${optionId} מכלים`;
    }
    return option.label;
  };

  const handleNext = () => {
    const selectedWorkers = Object.keys(workersAttendance);
    if (selectedWorkers.length === 0) {
      toast.error("נא לבחור נוכחות לפחות עובד אחד", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
      return;
    }

    // Validate custom containers input if selected
    const invalidWorker = selectedWorkers.find(workerId => 
      workersAttendance[workerId] === 'custom' && !customContainers[workerId]
    );

    if (invalidWorker) {
      toast.error("נא להזין מספר מכלים", {
        position: "top-center",
        autoClose: 3000,
        rtl: true
      });
      return;
    }

    onStepChange('issues');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>סימון נוכחות עובדים</h2>

      <div className={styles.workersList}>
        {workers.map((worker) => (
          <div key={worker.id} className={styles.workerAccordion}>
            <div 
              className={`${styles.workerHeader} ${openWorkerId === worker.id ? styles.open : ''}`}
              onClick={() => handleWorkerClick(worker.id)}
            >
              <div className={styles.workerInfo}>
                <span className={styles.name}>
                  {worker.firstName} {worker.lastName}
                </span>
                <span className={styles.passport}>
                  {worker.passport}
                </span>
              </div>
              <div className={styles.headerRight}>
                {workersAttendance[worker.id] && (
                  <span className={styles.selectedOption}>
                    {getDisplayLabel(workersAttendance[worker.id], worker.id)}
                  </span>
                )}
                <BsChevronDown className={styles.chevron} />
              </div>
            </div>
            
            {openWorkerId === worker.id && (
              <div className={styles.workerBody}>
                {attendanceOptions.map((option) => (
                  <label key={option.id} className={styles.optionItem}>
                    <input
                      type="radio"
                      name={`attendance-${worker.id}`}
                      checked={workersAttendance[worker.id] === option.id}
                      onChange={() => handleAttendanceSelect(worker.id, option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
                {workersAttendance[worker.id] === 'custom' && (
                  <div className={styles.customInput}>
                    <TextField
                      label="מספר מכלים"
                      width="100%"
                      value={customContainers[worker.id] || ''}
                      onChange={(e) => handleCustomContainers(worker.id, e.target.value)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid #E6E6E6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#374151',
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
