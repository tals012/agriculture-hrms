"use client";
import Image from "next/image";
import { Plus } from "@/svgs/plus";
import { useCallback, useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import { toast } from "react-toastify";
import { Trash } from "@/svgs/trash";
import { FaSms } from "react-icons/fa";
import { debounce } from "@/lib/debounce";
import getManagers from "@/app/(backend)/actions/managers/getManagers";
import deleteManager from "@/app/(backend)/actions/managers/deleteManager";
import sendManagerCredentialsSMS from "@/app/(backend)/actions/managers/sendManagerCredentialsSMS";

import resetManagerPassword from "@/app/(backend)/actions/managers/resetManagerPassword";

import CredentialsSmsModal from "@/components/credentialsSmsModal";
import styles from "@/styles/containers/bigModals/client/managers/managersTable.module.scss";

const ManagersTable = ({
  setIsCreateManagerModalOpen,
  createManagerStatus,
  setCreateManagerStatus,
  clientId,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [smsLoading, setSmsLoading] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");


  const fetchData = async (searchQuery) => {
    try {
      setLoading(true);
      const filters = {
        clientId,
        ...(searchQuery && { search: searchQuery }),
      };

      const res = await getManagers(filters);
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
    setCreateManagerStatus(null);
    debouncedFetchData(search);
  }, [search, createManagerStatus, debouncedFetchData, clientId]);

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
            הוספת מנהל
          </button>
        </div>
        <div className={styles.loading}>
          <Spinner />
        </div>
      </div>
    );
  }

  const handleDelete = async (managerId) => {
    try {
      const res = await deleteManager({ managerId });

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

  const handleSendSMS = async () => {
    if (!selected) return;
    try {
      setSmsLoading(true);

      const res = await sendManagerCredentialsSMS({
        managerId: selected.id,
        ...(generatedPassword && { password: generatedPassword }),
      });

      if (res?.status === 200) {
        toast.success(res.message, { position: "top-center" });
      } else {
        toast.error(res?.message || "שליחת ה-SMS נכשלה", { position: "top-center" });
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("שליחת ה-SMS נכשלה", { position: "top-center" });
    } finally {
      setSmsLoading(false);
    }
  };


  const handleGeneratePassword = async () => {
    if (!selected) return;
    try {
      setPasswordLoading(true);
      const res = await resetManagerPassword({ managerId: selected.id });
      if (res?.status === 200) {
        setGeneratedPassword(res.password);
        toast.success("נוצרה סיסמה חדשה", { position: "top-center" });
      } else {
        toast.error(res?.message || "יצירת הסיסמה נכשלה", { position: "top-center" });
      }
    } catch (error) {
      console.error("Error generating password:", error);
      toast.error("יצירת הסיסמה נכשלה", { position: "top-center" });
    } finally {
      setPasswordLoading(false);
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
          onClick={() => setIsCreateManagerModalOpen(true)}
        >
          <Plus color="#ffffff" />
          הוספת מנהל
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
                  <p>אין מנהלים</p>
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
                      onClick={() => {
                        setSelected(manager);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <FaSms />
                    </div>
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
      {selected && (
        <CredentialsSmsModal
          isOpen={!!selected}

          onClose={() => {
            setSelected(null);
            setGeneratedPassword("");
          }}
          name={selected.name}
          username={selected.user?.username}
          password={generatedPassword}
          onSend={handleSendSMS}
          onGenerate={handleGeneratePassword}
          loading={smsLoading}
          generating={passwordLoading}

        />
      )}
    </div>
  );
};

export default ManagersTable;
