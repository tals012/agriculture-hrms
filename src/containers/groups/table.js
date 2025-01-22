import Image from "next/image";
import styles from "@/styles/containers/groups/table.module.scss";

const Table = ({ data, setGroupId }) => {
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
                <th>שם הקבוצה</th>
                <th>שדה</th>
                {/* <th>מנהל</th> */}
                <th>מספר עובדים</th>
                <th>תיאור</th>
                <th>פעולות</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    <p>לא נמצאו קבוצות</p>
                  </td>
                </tr>
              )}

              {data.map((item, index) => (
                <tr key={index}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td
                    onClick={() => {
                      setGroupId(item.id);
                    }}
                  >
                    <p>{item.name}</p>
                  </td>
                  <td>
                    <p>{item.field.name}</p>
                  </td>
                  <td>
                    <p>{item.members.length}</p>
                  </td>
                  <td>
                    <p>{item.description || "-"}</p>
                  </td>
                  <td onClick={() => setGroupId(item.id)}>
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
