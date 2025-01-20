"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { BsCheck } from "react-icons/bs";
import TextField from "@/components/textField";
import DateField from "@/components/dateField";
import Spinner from "@/components/spinner";
import { getAvailableWorkers } from "@/app/(backend)/actions/clients/getAvailableWorkers";
import { assignWorkers } from "@/app/(backend)/actions/clients/assignWorkers";
import styles from "@/styles/smallModals/client/assignWorkers.module.scss";

export default function AssignWorkers({ setModalOpen, setAssignStatus, clientId }) {
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    note: "",
  });

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await getAvailableWorkers({ 
          clientId,
          search
        });
        
        if (response?.status === 200) {
          setWorkers(response.data);
        } else {
          toast.error(response?.message || "Failed to fetch workers");
        }
      } catch (error) {
        console.error("Error fetching workers:", error);
        toast.error("Failed to fetch workers");
      } finally {
        setLoadingWorkers(false);
      }
    };

    fetchWorkers();
  }, [clientId, search]);

  const handleInputChange = (e, key) => {
    if (key === "startDate") {
      setFormData(prev => ({
        ...prev,
        startDate: e
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [key]: e.target.value
      }));
    }
  };

  const toggleWorkerSelection = (workerId) => {
    setSelectedWorkers(prev => {
      if (prev.includes(workerId)) {
        return prev.filter(id => id !== workerId);
      } else {
        return [...prev, workerId];
      }
    });
  };

  const handleAssign = async () => {
    try {
      setLoading(true);
      const payload = {
        clientId,
        workerIds: selectedWorkers,
        startDate: formData.startDate,
        note: formData.note,
      };

      const res = await assignWorkers(payload);

      if (res?.status === 201) {
        toast.success(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
        setAssignStatus(true);
        setModalOpen(false);
      } else {
        if (res?.errors) {
          res.errors.forEach(error => {
            toast.error(`${error.field}: ${error.message}`, {
              position: "top-center",
              autoClose: 3000,
            });
          });
        } else {
          toast.error(res?.message || "Failed to assign workers", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error assigning workers:", error);
      toast.error("Internal server error", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = selectedWorkers.length > 0 && formData.startDate;

  return (
    <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <Image
            src="/assets/icons/cross-2.svg"
            alt="cross-icon"
            width={20}
            height={20}
            className={styles.closeIcon}
            onClick={() => setModalOpen(false)}
          />
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>הוספת עובדים</h2>

          <div className={styles.fields}>
            <div className={styles.searchInput}>
              <Image
                src="/assets/icons/search-2.svg"
                alt="search"
                width={16}
                height={16}
              />
              <input
                type="text"
                placeholder="חיפוש עובדים"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.workersList}>
              {loadingWorkers ? (
                <div className={styles.loading}>
                  <Spinner />
                </div>
              ) : workers.length === 0 ? (
                <p className={styles.noData}>לא נמצאו עובדים זמינים</p>
              ) : (
                workers.map((worker) => (
                  <div 
                    key={worker.id} 
                    className={`${styles.workerItem} ${
                      selectedWorkers.includes(worker.id) ? styles.selected : ""
                    }`}
                    onClick={() => toggleWorkerSelection(worker.id)}
                  >
                    <div className={styles.workerInfo}>
                      <p>{worker.nameHe} {worker.surnameHe}</p>
                      <span>{worker.passport}</span>
                    </div>
                    <div className={styles.checkbox}>
                      {selectedWorkers.includes(worker.id) && (
                        <BsCheck size={16} color="#2b85ff" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.formFields}>
              <DateField
                label="תאריך התחלה"
                width="48.3%"
                value={formData.startDate}
                onChange={(e) => handleInputChange(e, "startDate")}
                required
              />

              <TextField
                label="הערה"
                width="48.3%"
                value={formData.note}
                onChange={(e) => handleInputChange(e, "note")}
              />
            </div>

            <div className={styles.btns}>
              <button onClick={() => setModalOpen(false)}>ביטול</button>
              <button
                onClick={handleAssign}
                disabled={loading || !isFormValid}
              >
                {loading ? <Spinner color="#ffffff" /> : "הוספה"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 