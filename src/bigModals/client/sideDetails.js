"use client";
import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "react-toastify";
import Chip from "@/components/chip";
import Spinner from "@/components/spinner";
import updateClient from "@/app/(backend)/actions/clients/updateClient";
import styles from "@/styles/bigModals/client/sideDetails.module.scss";
import InitialsCircle from "@/components/initialsCircle";

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
      const res = await updateClient({
        payload: {
          id: data.id,
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
          src={data.logo || "/assets/icons/user-1.jpg"}
          alt="user"
          width={95}
          height={95}
        /> */}
        <InitialsCircle
          name={data.name}
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
          <h4>{data.name}</h4>
          <p className={styles.label}>מספר רישיון </p>
          <p>{data.licenseNumber || "-"}</p>
        </div>
      </div>

      <div className={styles.blocks}>
        <div className={styles.block}>
          <label>סטטוס</label>
          <Chip
            text={data.status === "ACTIVE" ? "פעיל" : "לא פעיל"}
            textColor={data.status === "ACTIVE" ? "#00B341" : "#FF0000"}
            bgColor={data.status === "ACTIVE" ? "#E6F4EA" : "#FEE8E8"}
          />
        </div>

        <div className={styles.block}>
          <label>מייל</label>
          <p>{data.email || "-"}</p>
        </div>

        <div className={styles.block}>
          <label>תוקף רישיון</label>
          <p>
            {data.licenseToDate
              ? format(new Date(data.licenseToDate), "dd-MM-yyyy")
              : "-"}
          </p>
        </div>

        <div className={styles.block}>
          <label>טלפון</label>
          <p>{data.phone || "-"}</p>
        </div>

        <div className={styles.block}>
          <label>טלפון משני</label>
          <p>{data.secondaryPhone || "-"}</p>
        </div>

        <div className={styles.block}>
          <label>כתובת</label>
          <p>{data.address || "-"}</p>
        </div>

        <div className={styles.block}>
          <label>עיר</label>
          <p>{data.city?.nameInHebrew || "-"}</p>
        </div>

        <div className={styles.block}>
          <label>תאריך פתיחה</label>
          <p>
            {data.openingDate
              ? format(new Date(data.openingDate), "dd-MM-yyyy")
              : "-"}
          </p>
        </div>
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
