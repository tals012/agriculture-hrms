"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Image from "next/image";
import ReactSelect from "react-select";
import Spinner from "@/components/spinner";
import getAvailableWorkers from "@/app/(backend)/actions/groups/getAvailableWorkers";
import styles from "@/styles/smallModals/group/createGroup.module.scss";
import addWorkersToGroup from "@/app/(backend)/actions/groups/addWorkersToGroup";

export default function AddWorkersToGroup({
  setModalOpen,
  onUpdate,
  groupId,
}) {
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

  const [loading, setLoading] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  const [workers, setWorkers] = useState([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setIsLoadingWorkers(true);
        const res = await getAvailableWorkers({ groupId });
        if (res?.status === 200) {
          setWorkers(res.data);
        }
      } catch (error) {
        console.error("Error fetching workers:", error);
        toast.error("Failed to fetch workers", {
          position: "top-center",
          autoClose: 3000,
        });
      } finally {
        setIsLoadingWorkers(false);
      }
    };

    fetchWorkers();
  }, []);

  const handleAddWorkers = async () => {
    try {
      setLoading(true);
      const res = await addWorkersToGroup({
        groupId,
        workers: selectedWorkers.map((worker) => worker.value),
      });
      if (res?.status === 200) {
        toast.success(res.message);
        setModalOpen(false);
        onUpdate();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error("Error adding workers to group:", error);
      toast.error("Failed to add workers to group");
    } finally {
      setLoading(false);
    }
  };

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
          <h2>הוספת עובדים לקבוצה</h2>

          <div className={styles.fields}>
            <div style={{ width: "100%" }}>
              <ReactSelect
                isMulti
                options={workers.map((worker) => ({
                  value: worker.id,
                  label: worker.nameHe + " " + worker.surnameHe + " | " + worker.passport,
                }))}
                components={{
                  IndicatorSeparator: () => null,
                }}
                placeholder="עובדים"
                value={selectedWorkers}
                onChange={setSelectedWorkers}
                styles={selectStyle}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isDisabled={isLoadingWorkers}
                isLoading={isLoadingWorkers}
              />
            </div>

            <button
              onClick={handleAddWorkers}
              disabled={loading || !selectedWorkers.length}
            >
              {loading ? <Spinner color="#ffffff" /> : "הוספה"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
