"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Image from "next/image";
import debounce from "lodash/debounce";
import Spinner from "@/components/spinner";
import getHarvestEntries from "@/app/(backend)/actions/harvestEntries/getHarvestEntries";
import styles from "@/styles/containers/bigModals/worker/harvestEntries/index.module.scss";

const HarvestEntries = ({ workerId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // * fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getHarvestEntries({
        payload: {
          workerId: workerId,
          search: search,
        },
      });

      const { status, data } = res;

      if (status === 200) {
        setData(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [workerId, search]);

  // * debounce search
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value);
    }, 500),
    []
  );

  // * handle search
  const handleSearch = (e) => {
    debouncedSearch(e.target.value);
  };

  // * fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className={styles.container}>
      {loading ? (
        <div className={styles.loading}>
          <Spinner />
        </div>
      ) : (
        <>
          <div className={styles.header}>
            <div className={styles.search}>
              <Image
                src="/icons/search.svg"
                alt="search"
                width={20}
                height={20}
              />
              <input
                type="text"
                placeholder="חיפוש..."
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table>
              <thead>
                <tr>
                  <th>מס׳</th>
                  <th>תאריך</th>
                  <th>שדה</th>
                  <th>מנהל</th>
                  <th>כמות</th>
                  <th>סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.date}</td>
                    <td>{item.field.name}</td>
                    <td>{item.manager.name}</td>
                    <td>{item.amount}</td>
                    <td>
                      <span
                        className={`${styles.status} ${
                          styles[item.status.toLowerCase()]
                        }`}
                      >
                        {
                          {
                            PENDING: "ממתין",
                            APPROVED: "מאושר",
                            REJECTED: "נדחה",
                          }[item.status]
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default HarvestEntries; 