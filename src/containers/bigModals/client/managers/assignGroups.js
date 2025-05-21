"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { debounce } from "@/lib/debounce";
import Spinner from "@/components/spinner";
import getGroups from "@/app/(backend)/actions/groups/getGroups";
import getManagers from "@/app/(backend)/actions/managers/getManagers";
import assignGroup from "@/app/(backend)/actions/managers/assignGroup";
import styles from "@/styles/containers/bigModals/client/managers/assignFields.module.scss";

const AssignGroups = ({ clientId }) => {
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedManager, setSelectedManager] = useState(null);

  const fetchGroups = async (searchQuery) => {
    try {
      const filters = {
        clientId,
        ...(searchQuery && { search: searchQuery })
      };

      const res = await getGroups(filters);
      if (res?.status === 200) {
        setGroups(res.data);
      } else {
        console.error("Error fetching groups:", res?.message);
        setGroups([]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
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

  const handleAssign = async (groupId) => {
    if (!selectedManager) {
      toast.error("אנא בחר מנהל תחילה", {
        position: "top-center",
      });
      return;
    }

    try {
      const res = await assignGroup({
        payload: {
          managerId: selectedManager,
          groupId,
        }
      });

      if (res?.status === 200) {
        toast.success(res.message, {
          position: "top-center",
        });
        fetchGroups(search);
      } else {
        toast.error(res?.message || "הקצאת הקבוצה נכשלה", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error assigning group:", error);
      toast.error("הקצאת הקבוצה נכשלה", {
        position: "top-center",
      });
    }
  };

  const debouncedFetchGroups = useCallback(debounce(fetchGroups, 300), [clientId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchManagers(),
        fetchGroups("")
      ]);
      setLoading(false);
    };

    init();
  }, [clientId]);

  useEffect(() => {
    debouncedFetchGroups(search);
  }, [search, debouncedFetchGroups]);

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
            placeholder="חיפוש קבוצה"
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
              <th>שם קבוצה</th>
              <th>שדה</th>
              <th>מנהל נוכחי</th>
              <th>פעולות</th>
            </tr>
          </thead>

          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  <p>אין קבוצות</p>
                </td>
              </tr>
            )}
            {groups.map((group) => (
              <tr key={group.id}>
                <td>
                  <p>{group.name}</p>
                </td>
                <td>
                  <p>{group.field.name}</p>
                </td>
                <td>
                  <p>{group.manager?.name || "-"}</p>
                </td>
                <td>
                  <button
                    onClick={() => handleAssign(group.id)}
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

export default AssignGroups;
