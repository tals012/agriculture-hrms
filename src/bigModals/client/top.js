"use client";
import Image from "next/image";
import updateClient from "@/app/(backend)/actions/clients/updateClient";
import { toast } from "react-toastify";
import styles from "@/styles/bigModals/client/top.module.scss";

const Top = ({ onClose, data, setData }) => {
  const handleStatus = async (status) => {
    try {
      const res = await updateClient({
        payload: {
          id: data.id,
          status
        },
      });

      if (res.status === 200) {
        toast.success(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
        setData({ ...data, status });
      }

      if (res.status === 400) {
        toast.error(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.container}>
      <div className="flex gap-[30px] items-center">
        <div
          className={styles.field}
          style={{
            backgroundColor: data.status === "ACTIVE" ? "#E9F7F1" : "#FEEFEE",
          }}
        >
          <select
            value={data.status}
            onChange={(e) => handleStatus(e.target.value)}
            style={{
              color: data.status === "ACTIVE" ? "#00563e" : "#EB5757",
            }}
          >
            <option value="ACTIVE">פעיל</option>
            <option value="INACTIVE">לא פעיל</option>
          </select>
        </div>
      </div>

      <Image
        src="/assets/icons/cross-2.svg"
        alt="close"
        width={24}
        height={24}
        onClick={onClose}
      />
    </div>
  );
};

export default Top;
