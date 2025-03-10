"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "react-toastify";
import Chip from "@/components/chip";
import Spinner from "@/components/spinner";
import updateWorker from "@/app/(backend)/actions/workers/updateWorker";
import styles from "@/styles/bigModals/worker/sideDetails.module.scss";
import InitialsCircle from "@/components/initialsCircle";

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

  const handleNote = async () => {
    try {
      setLoading(true);
      const res = await updateWorker({
        payload: {
          workerId: data.id,
          note: data.note,
        },
      });

      if (res.status === 200) {
        toast.success(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
      }

      if (res.status === 400) {
        toast.error(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
      }

      if (res.status === 500) {
        toast.error("שגיאת שרת פנימית", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.log(error);
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

        <textarea
          placeholder="הערות..."
          rows="4"
          cols="50"
          value={data.note || ""}
          onChange={(e) => setData({ ...data, note: e.target.value })}
        ></textarea>
        <button className={styles.noteBtn} onClick={handleNote}>
          {loading ? <Spinner color="#ffffff" /> : "שמירה"}
        </button>
      </div>
    </div>
  );
};

export default SideDetails;
