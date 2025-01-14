import Image from "next/image";
import { format } from "date-fns";
import Chip from "@/components/chip";
import InitialsCircle from "@/components/initialsCircle";
import styles from "@/styles/containers/clients/table.module.scss";

const Table = ({ setModalOpen, data }) => {
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
                <th>אימייל</th>
                <th>טלפון</th>
                <th>סטטוס</th>
                <th>תאריך פתיחה</th>
                <th>תוקף רישיון</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan="10">
                    <p>אין תוצאות</p>
                  </td>
                </tr>
              )}

              {data.map((item, index) => (
                <tr key={index}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td onClick={() => setModalOpen(item.id)}>
                    <div className={styles.user}>
                      {/* <Image
                        src="/assets/icons/avatar-1.png"
                        alt="avatar"
                        width={32}
                        height={32}
                      /> */}
                      <InitialsCircle
                        name={`${item.name ? item.name : item.nameEnglish}`}
                      />
                      <p>{`${item.name ? item.name : item.nameEnglish}`}</p>
                    </div>
                  </td>
                  <td>
                    <p>{item.email}</p>
                  </td>
                  <td>
                    <p>{item.phone}</p>
                  </td>
                  <td>
                    <Chip
                      text={item.status == "ACTIVE" ? "פעיל" : "לא פעיל"}
                      bgColor={item.status == "ACTIVE" ? "#EAF5F1" : "#FDECEC"}
                      textColor={
                        item.status == "ACTIVE" ? "#00563E" : "#D8000C"
                      }
                    />
                  </td>
                  <td>
                    <p>
                      {item.openingDate
                        ? format(new Date(item.licenseExpiry), "dd-MM-yyyy")
                        : "-"}
                    </p>
                  </td>
                  <td>
                    <p>
                      {item.licenseExpiry
                        ? format(new Date(item.licenseExpiry), "dd-MM-yyyy")
                        : "-"}
                    </p>
                  </td>
                  <td onClick={() => setModalOpen(item.id)}>
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
