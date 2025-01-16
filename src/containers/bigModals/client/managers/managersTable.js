"use client";
import Image from "next/image";
import { Plus } from "@/svgs/plus";
import getClientMedicalHistory from "@/actions/clients/getClientMedicalHistory";
import { useCallback, useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import deleteClientMedicalHistory from "@/actions/clients/deleteClientMedicalHistory";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { Trash } from "@/svgs/trash";
import { debounce } from "@/lib/debounce";
import styles from "@/styles/containers/bigModals/client/medical/sickHistoryTable.module.scss";

const ManagersTable = ({
  setIsCreateMedicalHistoryModalOpen,
  createMedicalHistoryStatus,
  setCreateMedicalHistoryStatus,
  clientId,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // * fetch medical history
  const fetchData = async (searchQuery) => {
    try {
      setLoading(true);
      let payload = { clientId };
      if (searchQuery) {
        payload.search = searchQuery;
      }
      const res = await getClientMedicalHistory({ payload });
      const { data, status } = res;
      if (status === 200) {
        setData(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchData = useCallback(debounce(fetchData, 300), []);

  useEffect(() => {
    setCreateMedicalHistoryStatus(null);
    debouncedFetchData(search);
  }, [search, createMedicalHistoryStatus, debouncedFetchData, clientId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.search}>
          <div className={styles.searchInput}>
            <Image
              src="/assets/icons/search-2.svg"
              alt="search"
              width={16}
              height={16}
            />
            <input
              type="text"
              placeholder="חיפוש"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.button}>
            <Plus color="#ffffff" />
            הוספה מצב רפואי
          </button>
        </div>
        <div className={styles.loading}>
          <Spinner />
        </div>
      </div>
    );
  }

  // * delete medical history record
  const handleDelete = async (medicalHistoryId) => {
    try {
      const res = await deleteClientMedicalHistory({
        payload: { medicalHistoryId },
      });

      const { status, message } = res;
      if (status === 200) {
        toast.success(message, {
          position: "top-center",
        });
        setCreateMedicalHistoryStatus(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.search}>
        <div className={styles.searchInput}>
          <Image
            src="/assets/icons/search-2.svg"
            alt="search"
            width={16}
            height={16}
          />
          <input
            type="text"
            placeholder="חיפוש"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={styles.button}
          onClick={() => setIsCreateMedicalHistoryModalOpen(true)}
        >
          <Plus color="#ffffff" />
          הוספה מצב רפואי
        </button>
      </div>
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>שם</th>
              <th>עלות</th>
              <th>מתאריך</th>
              <th>עד תאריך</th>
              <th>הערות</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  <p>אין תוצאות</p>
                </td>
              </tr>
            )}
            {data.map((item, index) => (
              <tr key={index}>
                <td>
                  <p>{item.name}</p>
                </td>
                <td>
                  <p>{item.cost}</p>
                </td>
                <td>
                  <p>{format(new Date(item.fromDate), "dd-MM-yyyy")}</p>
                </td>
                <td>
                  <p>{format(new Date(item.toDate), "dd-MM-yyyy")}</p>
                </td>
                <td>
                  <p>{item.note}</p>
                </td>
                <td>
                  <div className={styles.icons}>
                    <div
                      onClick={() => handleDelete(item.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <Trash color="red" />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagersTable;
