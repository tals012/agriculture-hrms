"use client";

import Image from "next/image";
import { Plus } from "@/svgs/plus";
import { useCallback, useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import { toast } from "react-toastify";
import { BsPencil, BsTrash } from "react-icons/bs";
import { debounce } from "@/lib/debounce";
import { getGroups } from "@/app/(backend)/actions/clients/getGroups";
import { deleteGroup } from "@/app/(backend)/actions/clients/deleteGroup";
import getManagers from "@/app/(backend)/actions/managers/getManagers";
import ReactSelect from "react-select";
import styles from "@/styles/containers/bigModals/client/managers/managersTable.module.scss";

const GroupsTable = ({
  setIsCreateGroupModalOpen,
  createGroupStatus,
  setCreateGroupStatus,
  clientId,
  fields = [],
  setManagers,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedField, setSelectedField] = useState(null);

  const selectStyle = {
    control: (baseStyles, state) => ({
      ...baseStyles,
      minWidth: "200px",
      width: "100%",
      border: "1px solid #E6E6E6",
      height: "44px",
      fontSize: "14px",
      color: "#999FA5",
      borderRadius: "6px",
      background: "transparent",
    }),
    menu: (baseStyles) => ({
      ...baseStyles,
      position: "absolute",
      minWidth: "200px",
      width: "100%",
      backgroundColor: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      zIndex: 99999,
    }),
    menuPortal: (baseStyles) => ({
      ...baseStyles,
      zIndex: 99999,
    }),
    container: (baseStyles) => ({
      ...baseStyles,
      width: "200px",
    }),
  };

  const fetchData = async (searchQuery, fieldId) => {
    try {
      setLoading(true);
      const filters = {
        clientId,
        ...(searchQuery && { search: searchQuery }),
        ...(fieldId && { fieldId }),
      };

      const res = await getGroups(filters);
      if (res?.status === 200) {
        setData(res.data);
      } else {
        console.error("Error fetching groups:", res?.message);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await getManagers({ clientId });
      if (res?.status === 200) {
        setManagers?.(res.data);
      } else {
        console.error("Error fetching managers:", res?.message);
        setManagers?.([]);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      setManagers?.([]);
    }
  };

  const debouncedFetchData = useCallback(
    debounce((search, fieldId) => fetchData(search, fieldId), 300),
    [clientId]
  );

  useEffect(() => {
    setCreateGroupStatus(null);
    debouncedFetchData(search, selectedField?.value);
  }, [search, selectedField, createGroupStatus, debouncedFetchData, clientId]);

  useEffect(() => {
    fetchManagers();
  }, [clientId]);

  const handleDelete = async (groupId) => {
    try {
      const res = await deleteGroup({
        id: groupId,
        clientId,
      });

      if (res?.status === 200) {
        toast.success(res.message, {
          position: "top-center",
        });
        debouncedFetchData(search, selectedField?.value);
      } else {
        toast.error(res?.message || "Failed to delete group", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group", {
        position: "top-center",
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.search}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "200px" }} className={styles.searchInput}>
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
            <div
              style={{
                width: "200px",
                marginLeft: "1rem",
                marginRight: "1rem",
              }}
            >
              <ReactSelect
                options={[
                  { value: null, label: "כל השדות" },
                  ...fields.map((field) => ({
                    value: field.id,
                    label: field.name,
                  })),
                ]}
                components={{
                  IndicatorSeparator: () => null,
                }}
                placeholder="בחר שדה"
                value={selectedField}
                onChange={setSelectedField}
                styles={selectStyle}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>
          </div>
          <button className={styles.button}>
            <Plus color="#ffffff" />
            הוספת קבוצה
          </button>
        </div>
        <div className={styles.loading}>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.search}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: "200px" }} className={styles.searchInput}>
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
          <div
            style={{
              width: "200px",
              marginLeft: "1rem",
              marginRight: "1rem",
            }}
          >
            <ReactSelect
              options={[
                { value: null, label: "כל השדות" },
                ...fields.map((field) => ({
                  value: field.id,
                  label: field.name,
                })),
              ]}
              components={{
                IndicatorSeparator: () => null,
              }}
              placeholder="בחר שדה"
              value={selectedField}
              onChange={setSelectedField}
              styles={selectStyle}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          </div>
        </div>
        <button
          className={styles.button}
          onClick={() => setIsCreateGroupModalOpen(true)}
        >
          <Plus color="#ffffff" />
          הוספת קבוצה
        </button>
      </div>
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>שם הקבוצה</th>
              <th>שדה</th>
              <th>מנהל</th>
              <th>מספר עובדים</th>
              <th>תיאור</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  <p>לא נמצאו קבוצות</p>
                </td>
              </tr>
            ) : (
              data.map((group) => (
                <tr key={group.id}>
                  <td>
                    <p>{group.name}</p>
                  </td>
                  <td>
                    <p>{group.field.name}</p>
                  </td>
                  <td>
                    <p>{group.manager.name}</p>
                  </td>
                  <td>
                    <p>{group.workers.length}</p>
                  </td>
                  <td>
                    <p>{group.description || "-"}</p>
                  </td>
                  <td>
                    <div className={styles.icons}>
                      <div
                        onClick={() => setIsEditGroupModalOpen(group)}
                        style={{ cursor: "pointer" }}
                      >
                        <BsPencil size={16} color="#666666" />
                      </div>
                      <div
                        onClick={() => handleDelete(group.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <BsTrash size={16} color="#ff4d4d" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroupsTable;
