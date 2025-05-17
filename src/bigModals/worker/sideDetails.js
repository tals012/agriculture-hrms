"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "react-toastify";
import Chip from "@/components/chip";
import Spinner from "@/components/spinner";
import updateWorker from "@/app/(backend)/actions/workers/updateWorker";
import getWorkerNotes from "@/app/(backend)/actions/workers/getWorkerNotes";
import styles from "@/styles/bigModals/worker/sideDetails.module.scss";
import InitialsCircle from "@/components/initialsCircle";

// SVG Components for inline usage
const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const AlertCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const statusMap = {
  ACTIVE: "פעיל",
  INACTIVE: "לא פעיל",
  FREEZE: "מוקפא",
  COMMITTEE: "ועדה",
  HIDDEN: "מוסתר",
  IN_TRANSIT: "במעבר",
};

const statusColorMap = {
  ACTIVE: { text: "#00B341", bg: "#E6F4EA" },
  INACTIVE: { text: "#FF0000", bg: "#FEE8E8" },
  FREEZE: { text: "#2196F3", bg: "#E3F2FD" },
  COMMITTEE: { text: "#FF9800", bg: "#FFF3E0" },
  HIDDEN: { text: "#9E9E9E", bg: "#F5F5F5" },
  IN_TRANSIT: { text: "#673AB7", bg: "#EDE7F6" },
};

const SideDetails = ({
  data,
  setData,
  isSideDetailsOpen,
  setIsSideDetailsOpen,
}) => {
  const [loading, setLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null, 'saving', 'saved', 'error'
  const [currentNote, setCurrentNote] = useState(data.note || "");
  const saveTimeoutRef = useRef(null);
  const initialLoadDoneRef = useRef(false);

  // Update currentNote when data changes
  useEffect(() => {
    setCurrentNote(data.note || "");
  }, [data.note]);

  // Fetch the latest notes when the component mounts or data.id changes
  useEffect(() => {
    const fetchNotes = async () => {
      if (!data.id || initialLoadDoneRef.current) return;

      try {
        setNotesLoading(true);
        const response = await getWorkerNotes({ workerId: data.id });

        if (
          response.status === 200 &&
          response.data &&
          response.data.note !== undefined
        ) {
          setCurrentNote(response.data.note);
          // Update the parent component's data with the fetched note
          setData((prevData) => ({ ...prevData, note: response.data.note }));
          initialLoadDoneRef.current = true;
        }
      } catch (error) {
        console.error("Error fetching worker notes:", error);
      } finally {
        setNotesLoading(false);
      }
    };

    fetchNotes();
  }, [data.id, setData]);

  // Reset the initialLoadDoneRef when the worker changes
  useEffect(() => {
    return () => {
      initialLoadDoneRef.current = false;
    };
  }, [data.id]);

  const handleNoteChange = (e) => {
    const newNote = e.target.value;
    setCurrentNote(newNote);
    setData({ ...data, note: newNote });

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a status to indicate we're going to save soon
    setSaveStatus("saving");

    // Set a new timeout to save after typing stops
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(newNote);
    }, 1000); // Wait 1 second after last keypress
  };

  const handleNoteBlur = () => {
    // If there's a pending save, cancel it and save immediately
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
      saveNote(currentNote);
    }
  };

  const saveNote = async (noteText) => {
    try {
      if (data.note === noteText) {
        // No changes, no need to save
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 3000);
        return;
      }

      setLoading(true);
      setSaveStatus("saving");

      const res = await updateWorker({
        payload: {
          workerId: data.id,
          note: noteText,
        },
      });

      if (res.status === 200) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("error");
        toast.error(res.message || "שגיאה בשמירת ההערות", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
      toast.error("שגיאה בשמירת ההערות", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${styles.container} ${
        isSideDetailsOpen ? styles.open : styles.close
      }`}
    >
      <div className={styles.card}>
        {/* <Image
          src="/assets/icons/user-1.jpg"
          alt="user"
          width={95}
          height={95}
        /> */}
        <InitialsCircle
          name={data.nameHe + " " + data.surnameHe}
          width={95}
          height={95}
          fontSize={20}
          fontWeight={600}
          lineHeight={24}
          letterSpacing={-0.15}
          textAlign="center"
        />
        <span className={styles.divider}></span>
        <div className={styles.text}>
          {data.nameHe && data.surnameHe && (
            <h4>
              {data.nameHe} {data.surnameHe}
            </h4>
          )}
        </div>
      </div>

      <div className={styles.blocks}>
        <div className={styles.block}>
          <label>סטטוס</label>
          <Chip
            text={statusMap[data.workerStatus]}
            textColor={statusColorMap[data.workerStatus].text}
            bgColor={statusColorMap[data.workerStatus].bg}
          />
        </div>

        {/* <div className={styles.block}>
          <label>מייל</label>
          <p>{data.email || "-"}</p>
        </div> */}

        <div className={styles.block}>
          <label>טלפון ראשי</label>
          <p>{data.primaryPhone || "-"}</p>
        </div>

        {/* <div className={styles.block}>
          <label>טלפון משני</label>
          <p>{data.secondaryPhone || "-"}</p>
        </div> */}

        <div className={styles.block}>
          <label>דרכון</label>
          <p>{data.passport || "-"}</p>
        </div>
        {/* 
        <div className={styles.block}>
          <label>תוקף דרכון</label>
          <p>
            {data.passportValidity
              ? format(new Date(data.passportValidity), "dd-MM-yyyy")
              : "-"}
          </p>
        </div>

        <div className={styles.block}>
          <label>ויזה</label>
          <p>{data.visa || "-"}</p>
        </div> */}

        {/* <div className={styles.block}>
          <label>תוקף ויזה</label>
          <p>
            {data.visaValidity
              ? format(new Date(data.visaValidity), "dd-MM-yyyy")
              : "-"}
          </p>
        </div> */}

        <div className={styles.block}>
          <label>מדינה</label>
          <p>{data.country?.nameInHebrew || "-"}</p>
        </div>

        {/* <div className={styles.block}>
          <label>עיר</label>
          <p>{data.city?.nameInHebrew || "-"}</p>
        </div>

        <div className={styles.block}>
          <label>תאריך רישום</label>
          <p>
            {data.inscriptionDate
              ? format(new Date(data.inscriptionDate), "dd-MM-yyyy")
              : "-"}
          </p>
        </div> */}

        {/* <div className={styles.block}>
          <label>תאריך כניסה</label>
          <p>
            {data.entryDate
              ? format(new Date(data.entryDate), "dd-MM-yyyy")
              : "-"}
          </p>
        </div> */}
      </div>

      <div className={styles.note}>
        <div className={styles.title}>
          <div className={styles.icon}>
            <Image
              src="/assets/icons/file-1.svg"
              alt="file"
              width={20}
              height={20}
            />
          </div>
          <h3>הערות</h3>
        </div>

        {notesLoading ? (
          <div className={styles.notesLoading}>
            <Spinner size={20} color="#999" />
            <span>טוען הערות...</span>
          </div>
        ) : (
          <>
            <textarea
              placeholder="הערות..."
              rows="4"
              cols="50"
              value={currentNote}
              onChange={handleNoteChange}
              onBlur={handleNoteBlur}
            ></textarea>

            <div className={styles.saveStatus}>
              {saveStatus === "saving" && (
                <div className={styles.savingIndicator}>
                  <Spinner size={14} color="#999" />
                  <span>שומר שינויים...</span>
                </div>
              )}
              {saveStatus === "saved" && (
                <div className={styles.savedIndicator}>
                  <CheckCircleIcon />
                  <span>השינויים נשמרו</span>
                </div>
              )}
              {saveStatus === "error" && (
                <div className={styles.errorIndicator}>
                  <AlertCircleIcon />
                  <span>שגיאה בשמירה, נסה שוב</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SideDetails;
