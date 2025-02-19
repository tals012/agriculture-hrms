"use client";

import { useEffect, useState } from "react";
import { getCookie } from "@/lib/getCookie";
import getProfile from "@/app/(backend)/actions/auth/getProfile";
import Spinner from "@/components/spinner";
import Image from "next/image";
import getGroups from "@/app/(backend)/actions/groups/getGroups";
import styles from "@/styles/screens/my-fields.module.scss";

export default function MyGroupsPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [managerId, setManagerId] = useState(null);
  const [emptyState, setEmptyState] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = getCookie("token");
      const { data } = await getProfile({ token });
      setManagerId(data.manager.id);
    };
    fetchData();
  }, []);

  const fetchGroups = async () => {
    try {
      if (!managerId) return;

      const response = await getGroups({ managerId });
      if (response.status === 200) {
        if (response.data.length === 0) {
          setEmptyState(true);
          setGroups([]);
        } else {
          setGroups(response.data);
          setEmptyState(false);
        }

        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [managerId]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size={40} color="#4f46e5" />
        <p>טוען את נתוני הקבוצות...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.workersSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.leftSide}>
            <h2>הקבוצות שלי</h2>
            <div className={styles.stats}>
              <div className={styles.stat}>
                סה״כ קבוצות: <span>{groups.length}</span>
              </div>
              <div className={styles.stat}>
                קבוצות פעילות:{" "}
                <span>
                  {groups.filter((group) => group.status === "ACTIVE").length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <div className={styles.wrapper}>
            <div className={styles.tableContainer}>
              {emptyState ? (
                <div className={styles.emptyState}>
                  <Image
                    src="/assets/images/empty-fields.svg"
                    alt="No groups found"
                    width={200}
                    height={200}
                    priority
                  />
                  <h3>לא נמצאו קבוצות</h3>
                  <p>נראה שאין לך קבוצות מוקצות כרגע</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>שם הקבוצה</th>
                      <th>שדה</th>
                      <th>מספר עובדים</th>
                      <th>תיאור</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr key={group.id}>
                        <td>
                          <p>{group.name}</p>
                        </td>
                        <td>
                          <p>{group.field.name}</p>
                        </td>
                        <td>
                          <p>{group.members.length}</p>
                        </td>
                        <td>
                          <p>{group.description || "-"}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
