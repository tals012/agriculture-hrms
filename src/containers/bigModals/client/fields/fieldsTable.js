"use client";
import Image from "next/image";
import { Plus } from "@/svgs/plus";
import { useCallback, useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import { toast } from "react-toastify";
import { Trash } from "@/svgs/trash";
import { debounce } from "@/lib/debounce";
import getFields from "@/app/(backend)/actions/fields/getFields";
import deleteField from "@/app/(backend)/actions/fields/deleteField";
import styles from "@/styles/containers/bigModals/client/managers/managersTable.module.scss";

const FieldsTable = ({
  setIsCreateFieldModalOpen,
  createFieldStatus,
  setCreateFieldStatus,
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
        ...(searchQuery && { search: searchQuery })
      };
      
      const res = await getFields(filters);
      if (res?.status === 200) {
        setData(res.data);
      } else {
        console.error("Error fetching fields:", res?.message);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching fields:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchData = useCallback(debounce(fetchData, 300), [clientId]);

  useEffect(() => {
    setCreateFieldStatus(null);
    debouncedFetchData(search);
  }, [search, createFieldStatus, debouncedFetchData, clientId]);

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
            הוספת שדה
          </button>
        </div>
        <div className={styles.loading}>
          <Spinner />
        </div>
      </div>
    );
  }

  const handleDelete = async (fieldId) => {
    try {
      const res = await deleteField({
        payload: { fieldId }
      });

      if (res?.status === 200) {
        toast.success(res.message, {
          position: "top-center",
        });
        debouncedFetchData(search);
      } else {
        toast.error(res?.message || "Failed to delete field", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error("Failed to delete field", {
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
          onClick={() => setIsCreateFieldModalOpen(true)}
        >
          <Plus color="#ffffff" />
          הוספת שדה
        </button>
      </div>
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>מס׳</th>
              <th>שם</th>
              <th>סוג תוצרת</th>
              <th>איש קשר</th>
              <th>טלפון</th>
              <th>כתובת</th>
              <th>גודל</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: "center" }}>
                  <p>אין שדות</p>
                </td>
              </tr>
            )}
            {data.map((field) => (
              <tr key={field.id}>
                <td>
                  <p>{field.serialNumber}</p>
                </td>
                <td>
                  <p>{field.name}</p>
                </td>
                <td>
                  <p>{field.typeOfProduct}</p>
                </td>
                <td>
                  <p>{field.contactPersonName}</p>
                </td>
                <td>
                  <p>{field.contactPhone}</p>
                </td>
                <td>
                  <p>{field.address}</p>
                </td>
                <td>
                  <p>{field.size ? `${field.size} דונם` : "-"}</p>
                </td>
                <td>
                  <p>{field.status === "ACTIVE" ? "פעיל" : "לא פעיל"}</p>
                </td>
                <td>
                  <div className={styles.icons}>
                    <div
                      onClick={() => handleDelete(field.id)}
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

export default FieldsTable; 