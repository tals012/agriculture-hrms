"use client";

import { useEffect, useState, useCallback } from "react";
import ScreenFilter from "@/components/screenFilter";
import ScreenHead from "@/components/screenHead";
import Table from "@/containers/workers/table";
import CreateWorker from "@/smallModals/worker/createWorker";
import { ToastContainer } from "react-toastify";
import getWorkers from "@/app/(backend)/actions/workers/getWorkers";
import Spinner from "@/components/spinner";
import getWorkersStats from "@/app/(backend)/actions/workers/getWorkersStats";
import { debounce } from "@/lib/debounce";
import { useRouter } from "next/navigation";
import { getCookie } from "@/lib/getCookie";
import styles from "@/styles/screens/workers.module.scss";
import Worker from "@/bigModals/worker";
import ReactSelect from "react-select";

const FilterBox = ({ setIsOpen, filters, setFilters, handleSearch }) => {
  return (
    <div className={styles.filterBox}>
      <div className={styles.fields}>
        <input
          type="text"
          placeholder="שם"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="טלפון"
          value={filters.phone}
          onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
        />
        <ReactSelect
          options={[
            { value: "ACTIVE", label: "פעיל" },
            { value: "INACTIVE", label: "לא פעיל" },
            { value: "FREEZE", label: "מוקפא" },
            { value: "COMMITTEE", label: "ועדה" },
            { value: "HIDDEN", label: "מוסתר" },
            { value: "IN_TRANSIT", label: "במעבר" },
          ]}
          value={
            filters.status
              ? {
                  value: filters.status,
                  label: {
                    ACTIVE: "פעיל",
                    INACTIVE: "לא פעיל",
                    FREEZE: "מוקפא",
                    COMMITTEE: "ועדה",
                    HIDDEN: "מוסתר",
                    IN_TRANSIT: "במעבר",
                  }[filters.status],
                }
              : null
          }
          onChange={(option) =>
            setFilters({ ...filters, status: option ? option.value : "" })
          }
          placeholder="סטטוס"
          isClearable
        />
      </div>
      <div className={styles.btns}>
        <button onClick={() => setIsOpen(false)}>ביטול</button>
        <button onClick={handleSearch}>חיפוש</button>
      </div>
    </div>
  );
};

export default function Workers() {
  const router = useRouter();
  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const [workerId, setWorkerId] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createStatus, setCreateStatus] = useState(null);
  const [stats, setStats] = useState({
    totalWorkersCount: 0,
    newWorkersCount: 0,
    activeWorkersCount: 0,
    inactiveWorkersCount: 0,
    freezeWorkersCount: 0,
    committeeWorkersCount: 0,
    hiddenWorkersCount: 0,
    inTransitWorkersCount: 0,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    status: "",
    phone: "",
  });

  const fetchData = async (searchQuery = "", currentFilters = {}) => {
    try {
      setLoading(true);

      const payload = {
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(currentFilters.name ? { name: currentFilters.name } : {}),
        ...(currentFilters.status ? { status: currentFilters.status } : {}),
        ...(currentFilters.phone ? { phone: currentFilters.phone } : {}),
      };
      
      const res = await getWorkers(payload);
      if (res?.status === 200) {
        setWorkers(res.data || []);
      } else {
        setWorkers([]);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };
  const debouncedFetchData = useCallback(
    debounce((searchQuery, currentFilters) => fetchData(searchQuery, currentFilters), 300),
    []
  );

  useEffect(() => {
    debouncedFetchData(search, filters);
  }, [search, filters, debouncedFetchData]);


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getWorkersStats();
        if (res?.status === 200) {
          setStats(
            res.data || {
              totalWorkersCount: 0,
              newWorkersCount: 0,
              activeWorkersCount: 0,
              inactiveWorkersCount: 0,
              freezeWorkersCount: 0,
              committeeWorkersCount: 0,
              hiddenWorkersCount: 0,
              inTransitWorkersCount: 0,
            }
          );
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [createStatus]);

  const handleSearch = () => {
    fetchData(search, filters);
    setFilterOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead
          title="עובדים"
          count={stats?.totalWorkersCount}
          desc="כאן תוכל לראות את כל העובדים שלך"
          stats={[
            {
              value: stats?.newWorkersCount,
              text: "עובדים חדשים",
            },
            {
              value: stats?.activeWorkersCount,
              text: "עובדים פעילים",
            },
            {
              value: stats?.inactiveWorkersCount,
              text: "עובדים לא פעילים",
            },
          ]}
        />
        <div className={styles.screenFilterWrapper}>
          <ScreenFilter
            isSearch={true}
            filter={true}
            filterClickHandler={() => setFilterOpen(true)}
            setIsCreateModalOpen={setIsCreateModalOpen}
            search={search}
            setSearch={setSearch}
            createText="הוספת עובד"
          />
          {filterOpen && (
            <FilterBox
              setIsOpen={setFilterOpen}
              filters={filters}
              setFilters={setFilters}
              handleSearch={handleSearch}
            />
          )}
        </div>
        {loading ? (
          <div className={styles.loader}>
            <Spinner size={30} />
          </div>
        ) : (
          <Table data={workers} setWorkerId={setWorkerId} />
        )}
      </div>
      <Worker isOpen={workerId} onClose={() => setWorkerId(false)} />
      {isCreateModalOpen && (
        <CreateWorker
          setModalOpen={setIsCreateModalOpen}
          setCreateStatus={setCreateStatus}
        />
      )}
      <ToastContainer />
    </div>
  );
} 