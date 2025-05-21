"use client";

import { useEffect, useState } from "react";
import { getCookie } from "@/lib/getCookie";
import getProfile from "@/app/(backend)/actions/auth/getProfile";
import getFields from "@/app/(backend)/actions/fields/getFields";
import Spinner from "@/components/spinner";
import Chip from "@/components/chip";
import Image from "next/image";
import styles from "@/styles/screens/my-fields.module.scss";

export default function MyFieldsPage() {
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState([]);
  const [regionManagerId, setRegionManagerId] = useState(null);
  const [emptyState, setEmptyState] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = getCookie("token");
      const { data } = await getProfile({ token });
      setRegionManagerId(data.regionManager.id);
    };
    fetchData();
  }, []);

  const fetchFields = async () => {
    try {
      if (!regionManagerId) return;

      const response = await getFields({ regionManagerId });
      console.log(response, "response");
      if (response.status === 200) {
        if (response.data.length === 0) {
          setEmptyState(true);
          setFields([]);
        } else {
          setFields(response.data);
          setEmptyState(false);
        }

        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching fields:", error);
      setFields([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [regionManagerId]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size={40} color="#4f46e5" />
        <p>טוען את נתוני השדות...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.workersSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.leftSide}>
            <h2>השדות שלי</h2>
            <div className={styles.stats}>
              <div className={styles.stat}>
                סה״כ שדות: <span>{fields.length}</span>
              </div>
              <div className={styles.stat}>
                שדות פעילים:{" "}
                <span>
                  {fields.filter((field) => field.status === "ACTIVE").length}
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
                    alt="No fields found"
                    width={200}
                    height={200}
                    priority
                  />
                  <h3>לא נמצאו שדות</h3>
                  <p>נראה שאין לך שדות מוקצים כרגע</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>מס׳</th>
                      <th>שם השדה</th>
                      <th>סוג תוצרת</th>
                      <th>לקוח</th>
                      <th>איש קשר</th>
                      <th>טלפון</th>
                      <th>גודל (דונם)</th>
                      <th>סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
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
                          <p>{field.client?.name || "-"}</p>
                        </td>
                        <td>
                          <p>{field.contactPersonName || "-"}</p>
                        </td>
                        <td>
                          <p>{field.contactPhone || "-"}</p>
                        </td>
                        <td>
                          <p>{field.size || "-"}</p>
                        </td>
                        <td>
                          <Chip
                            text={
                              field.status === "ACTIVE" ? "פעיל" : "לא פעיל"
                            }
                            bgColor={
                              field.status === "ACTIVE" ? "#EAF5F1" : "#FDECEC"
                            }
                            textColor={
                              field.status === "ACTIVE" ? "#00563E" : "#D8000C"
                            }
                          />
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
