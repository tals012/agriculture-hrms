"use client";

import Image from "next/image";
import updateWorker from "@/app/(backend)/actions/workers/updateWorker";
import { toast } from "react-toastify";
import styles from "@/styles/bigModals/worker/top.module.scss";

const Top = ({ onClose, data, setData }) => {
  const handleStatus = async (workerStatus) => {
    try {
      const res = await updateWorker({
        payload: {
          workerId: data.id,
          workerStatus,
        },
      });

      if (res.status === 200) {
        toast.success(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
        setData({ ...data, workerStatus });
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

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return { bg: "#E9F7F1", text: "#00563e" };
      case "INACTIVE":
        return { bg: "#FEEFEE", text: "#EB5757" };
      case "FREEZE":
        return { bg: "#E3F2FD", text: "#1565C0" };
      case "COMMITTEE":
        return { bg: "#FFF3E0", text: "#E65100" };
      case "HIDDEN":
        return { bg: "#F5F5F5", text: "#616161" };
      case "IN_TRANSIT":
        return { bg: "#EDE7F6", text: "#4527A0" };
      default:
        return { bg: "#E9F7F1", text: "#00563e" };
    }
  };

  const statusMap = {
    ACTIVE: "פעיל",
    INACTIVE: "לא פעיל",
    FREEZE: "מוקפא",
    COMMITTEE: "ועדה",
    HIDDEN: "מוסתר",
    IN_TRANSIT: "במעבר",
  };

  return (
    <div className={styles.container}>
      <div className="flex gap-[30px] items-center">
        <div
          className={styles.field}
          style={{
            backgroundColor: getStatusColor(data.workerStatus).bg,
          }}
        >
          <select
            value={data.workerStatus}
            onChange={(e) => handleStatus(e.target.value)}
            style={{
              color: getStatusColor(data.workerStatus).text,
            }}
          >
            {Object.entries(statusMap).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
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
