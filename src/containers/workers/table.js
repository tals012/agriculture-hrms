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
  DEFAULT: { text: "#424242", bg: "#F5F5F5" }, // Fallback for unknown status
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
                <th>מס״ד</th>
                <th>שם העובד</th>
                <th>דרכון</th>
                <th>טלפון</th>
                <th>סטטוס</th>
                <th>מדינה</th>
                <th>קבוצה</th>
                <th>פעולות</th>
              </tr>
            </thead>

            <tbody>
              {data.map((item, index) => {
                const status = item.workerStatus || "DEFAULT";
                const colors = statusColorMap[status] || statusColorMap.DEFAULT;
                const fullName = `${item.name || ""} ${
                  item.surname || ""
                }`.trim();
                const groupNames =
                  item.groups && item.groups.length > 0
                    ? item.groups.map((g) => g.group.name).join(", ")
                    : "-";

                return (
                  <tr key={index}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <p>{item.serialNumber || "-"}</p>
                    </td>
                    <td onClick={() => setWorkerId(item.id)}>
                      <div className={styles.user}>
                        <InitialsCircle name={fullName} />
                        <div className={styles.name}>
                          <p>{fullName}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p>{item.passport || "-"}</p>
                    </td>
                    <td>
                      {item.primaryPhone ? (
                        <div className={styles.phones}>
                          <p>{item.primaryPhone}</p>
                        </div>
                      ) : (
                        <p>-</p>
                      )}
                    </td>
                    <td>
                      <Chip
                        text={statusMap[status] || status}
                        textColor={colors.text}
                        bgColor={colors.bg}
                      />
                    </td>
                    <td>
                      <p>{item.country?.nameInHebrew || "-"}</p>
                    </td>
                    <td>
                      <p>{groupNames}</p>
                    </td>
                    <td onClick={() => setWorkerId(item.id)}>
                      <Image
                        src="/assets/icons/menu-2.svg"
                        alt="menu"
                        width={16}
                        height={16}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Table;
