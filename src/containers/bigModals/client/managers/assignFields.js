"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { debounce } from "@/lib/debounce";
import Spinner from "@/components/spinner";
import getFields from "@/app/(backend)/actions/fields/getFields";
import getManagers from "@/app/(backend)/actions/managers/getManagers";
import assignField from "@/app/(backend)/actions/managers/assignField";
import styles from "@/styles/containers/bigModals/client/managers/assignFields.module.scss";

const AssignFields = ({ clientId }) => {
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [fields, setFields] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedManager, setSelectedManager] = useState(null);

  const fetchFields = async (searchQuery) => {
    try {
      const filters = {
        clientId,
        ...(searchQuery && { search: searchQuery })
      };
      
      const res = await getFields(filters);
      if (res?.status === 200) {
        setFields(res.data);
      } else {
        console.error("Error fetching fields:", res?.message);
        setFields([]);
      }
    } catch (error) {
      console.error("Error fetching fields:", error);
      setFields([]);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await getManagers({ clientId });
      if (res?.status === 200) {
        setManagers(res.data);
      } else {
        console.error("Error fetching managers:", res?.message);
        setManagers([]);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      setManagers([]);
    }
  };

  const handleAssign = async (fieldId) => {
    if (!selectedManager) {
      toast.error("אנא בחר מנהל תחילה", {
        position: "top-center",
      });
      return;
    }

    try {
      const res = await assignField({
        payload: {
          managerId: selectedManager,
          fieldId,
        }
      });

      if (res?.status === 200) {
        toast.success(res.message, {
          position: "top-center",
        });
        fetchFields(search);
      } else {
        toast.error(res?.message || "הקצאת השדה נכשלה", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error assigning field:", error);
      toast.error("הקצאת השדה נכשלה", {
        position: "top-center",
      });
    }
  };

  const debouncedFetchFields = useCallback(debounce(fetchFields, 300), [clientId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchManagers(),
        fetchFields("")
      ]);
      setLoading(false);
    };

    init();
  }, [clientId]);

  useEffect(() => {
    debouncedFetchFields(search);
  }, [search, debouncedFetchFields]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.search}>
          <Image
            src="/assets/icons/search-2.svg"
            alt="search"
            width={16}
            height={16}
          />
          <input
            type="text"
            placeholder="חיפוש שדה"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={selectedManager || ""}
          onChange={(e) => setSelectedManager(e.target.value)}
          className={styles.select}
        >
          <option value="">בחר מנהל</option>
          {managers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>מס׳</th>
              <th>שם</th>
              <th>סוג תוצרת</th>
              <th>כתובת</th>
              <th>מנהל נוכחי</th>
              <th>פעולות</th>
            </tr>
          </thead>

          <tbody>
            {fields.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  <p>אין שדות</p>
                </td>
              </tr>
            )}
            {fields.map((field) => (
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
                  <p>{field.address || "-"}</p>
                </td>
                <td>
                  <p>{field.manager?.name || "-"}</p>
                </td>
                <td>
                  <button
                    onClick={() => handleAssign(field.id)}
                    disabled={!selectedManager}
                    className={styles.assignButton}
                  >
                    שייך
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignFields; 