"use client";
import Image from "next/image";
import { Plus } from "@/svgs/plus";
import { useCallback, useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import { toast } from "react-toastify";
import { Trash } from "@/svgs/trash";
import { debounce } from "@/lib/debounce";
import getRegionManagers from "@/app/(backend)/actions/regionManagers/getRegionManagers";
import deleteRegionManager from "@/app/(backend)/actions/regionManagers/deleteRegionManager";
import styles from "@/styles/containers/bigModals/client/managers/managersTable.module.scss";

const RegionManagersTable = ({
  setIsCreateRegionManagerModalOpen,
  createRegionManagerStatus,
  setCreateRegionManagerStatus,
  clientId,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async (searchQuery) => {
    try {
      setLoading(true);
      const filters = {
        clientId,
        ...(searchQuery && { search: searchQuery }),
      };

      const res = await getRegionManagers(filters);
      if (res?.status === 200) {
        setData(res.data);
      } else {
        console.error("Error fetching managers:", res?.message);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchData = useCallback(debounce(fetchData, 300), [clientId]);

  useEffect(() => {
    setCreateRegionManagerStatus(null);
    debouncedFetchData(search);
  }, [search, createRegionManagerStatus, debouncedFetchData, clientId]);

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
            הוספת מנהל אזור
          </button>
        </div>
        <div className={styles.loading}>
          <Spinner />
        </div>
      </div>
    );
  }

  const handleDelete = async (regionManagerId) => {
    try {
      const res = await deleteRegionManager({ regionManagerId });

      if (res?.status === 200) {
        toast.success(res.message, {
          position: "top-center",
        });
        debouncedFetchData(search);
      } else {
        toast.error(res?.message || "מחיקת המנהל נכשלה", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error deleting manager:", error);
      toast.error("מחיקת המנהל נכשלה", {
        position: "top-center",
      });
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
          onClick={() => setIsCreateRegionManagerModalOpen(true)}
        >
          <Plus color="#ffffff" />
          הוספת מנהל אזור
        </button>
      </div>
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>שם</th>
              <th>אימייל</th>
              <th>טלפון</th>
              <th>פעולות</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  <p>אין מנהלי אזור</p>
                </td>
              </tr>
            )}
            {data.map((manager) => (
              <tr key={manager.id}>
                <td>
                  <p>{manager.name}</p>
                </td>
                <td>
                  <p>{manager.email}</p>
                </td>
                <td>
                  <p>{manager.phone}</p>
                </td>
                <td>
                  <div className={styles.icons}>
                    <div
                      onClick={() => handleDelete(manager.id)}
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

export default RegionManagersTable;
