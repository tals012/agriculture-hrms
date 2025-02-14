"use client";

import Image from "next/image";
import { format } from "date-fns";
import Chip from "@/components/chip";
import InitialsCircle from "@/components/initialsCircle";
import styles from "@/styles/containers/workers/table.module.scss";

const statusMap = {
  ACTIVE: "פעיל",
  INACTIVE: "לא פעיל",
  FREEZE: "מוקפא",
  COMMITTEE: "ועדה",
  HIDDEN: "מוסתר",
  IN_TRANSIT: "במעבר",
};

const statusColorMap = {
  ACTIVE: { text: "#00563E", bg: "#EAF5F1" },
  INACTIVE: { text: "#D8000C", bg: "#FDECEC" },
  FREEZE: { text: "#0D47A1", bg: "#E3F2FD" },
  COMMITTEE: { text: "#E65100", bg: "#FFF3E0" },
  HIDDEN: { text: "#424242", bg: "#F5F5F5" },
  IN_TRANSIT: { text: "#4A148C", bg: "#EDE7F6" },
};

const Table = ({ data = [], setWorkerId }) => {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.tableContainer}>
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" />
                </th>
                <th>שם</th>
                <th>טלפון</th>
                <th>דרכון</th>
                <th>תוקף ויזה</th>
                <th>מדינה</th>
                <th>סטטוס</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan="11">
                    <p>אין תוצאות</p>
                  </td>
                </tr>
              )}

              {data.map((worker) => (
                <tr key={worker.id}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td onClick={() => setWorkerId(worker.id)}>
                    <div className={styles.user}>
                      <InitialsCircle
                        name={`${worker.nameHe} ${worker.surnameHe}`}
                        width={32}
                        height={32}
                        fontSize={15}
                        fontWeight={400}
                        lineHeight={24}
                        letterSpacing={-0.15}
                        textAlign="center"
                      />
                      <div className={styles.name}>
                        <p>
                          {worker.nameHe} {worker.surnameHe}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.phones}>
                      <p>{worker.primaryPhone}</p>
                      {worker.secondaryPhone && (
                        <span>{worker.secondaryPhone}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <p>{worker.passport || "-"}</p>
                  </td>
                  <td>
                    <p>
                      {worker.visaValidity
                        ? format(new Date(worker.visaValidity), "dd-MM-yyyy")
                        : "-"}
                    </p>
                  </td>
                  <td>
                    <p>{worker.country?.nameInHebrew || "-"}</p>
                  </td>
                  <td>
                    <Chip
                      text={statusMap[worker.workerStatus]}
                      bgColor={statusColorMap[worker.workerStatus].bg}
                      textColor={statusColorMap[worker.workerStatus].text}
                    />
                  </td>
                  <td onClick={() => setWorkerId(worker.id)}>
                    <Image
                      src="/assets/icons/menu-2.svg"
                      alt="menu"
                      width={16}
                      height={16}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Table;
