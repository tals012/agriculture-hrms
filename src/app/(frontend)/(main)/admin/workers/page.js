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
import Worker from "@/bigModals/worker";
import ReactSelect from "react-select";
import getCountries from "@/app/(backend)/actions/misc/getCountries";
import getGroups from "@/app/(backend)/actions/groups/getGroups";
import styles from "@/styles/screens/workers.module.scss";

const FilterBox = ({ setIsOpen, filters, setFilters, handleSearch }) => {
  const [countries, setCountries] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Create select styles with appropriate z-index values
  const createSelectStyle = (zIndex) => ({
    control: (baseStyles) => ({
      ...baseStyles,
      width: "100%",
      border: "1px solid #E6E6E6",
      height: "44px",
      fontSize: "14px",
      color: "#999FA5",
      borderRadius: "6px",
      background: "white",
      minHeight: "44px",
      boxShadow: "none",
      "&:hover": {
        border: "1px solid #E6E6E6",
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "0 8px",
      height: "42px",
      display: "flex",
      alignItems: "center"
    }),
    placeholder: (provided) => ({
      ...provided,
      position: "absolute",
      color: "#999FA5",
      fontSize: "14px",
      marginLeft: "0",
      marginRight: "0",
      top: "50%",
      transform: "translateY(-50%)"
    }),
    input: (provided) => ({
      ...provided,
      margin: "0",
      padding: "0"
    }),
    singleValue: (provided) => ({
      ...provided,
      margin: "0"
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: "42px"
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999 + zIndex,
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999 + zIndex,
    }),
  });

  const statusSelectStyle = createSelectStyle(30);
  const countrySelectStyle = createSelectStyle(20);
  const groupSelectStyle = createSelectStyle(10);

  // Fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await getCountries();
        if (response.status === 200) {
          setCountries(
            response.data.map((country) => ({
              value: country.id,
              label: country.nameInHebrew,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await getGroups({});
        if (response.status === 200) {
          setGroups(
            response.data.map((group) => ({
              value: group.id,
              label: group.name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

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
        {/* passport */}
        <input
          type="text"
          placeholder="ת.ז"
          value={filters.passport}
          onChange={(e) => setFilters({ ...filters, passport: e.target.value })}
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
          styles={statusSelectStyle}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
        {/* Country filter */}
        <ReactSelect
          options={countries}
          isLoading={loadingCountries}
          value={
            filters.countryId && countries.length
              ? countries.find((c) => c.value === filters.countryId)
              : null
          }
          onChange={(option) =>
            setFilters({ ...filters, countryId: option ? option.value : "" })
          }
          placeholder="מדינה"
          isClearable
          styles={countrySelectStyle}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
        {/* Group filter */}
        <ReactSelect
          options={groups}
          isLoading={loadingGroups}
          value={
            filters.groupId && groups.length
              ? groups.find((g) => g.value === filters.groupId)
              : null
          }
          onChange={(option) =>
            setFilters({ ...filters, groupId: option ? option.value : "" })
          }
          placeholder="קבוצה"
          isClearable
          styles={groupSelectStyle}
          menuPortalTarget={document.body}
          menuPosition="fixed"
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
    passport: "",
    countryId: "",
    groupId: "",
  });

  const fetchData = async (searchQuery = "", currentFilters = {}) => {
    try {
      setLoading(true);

      const payload = {
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(currentFilters.name ? { name: currentFilters.name } : {}),
        ...(currentFilters.status ? { status: currentFilters.status } : {}),
        ...(currentFilters.phone ? { phone: currentFilters.phone } : {}),
        ...(currentFilters.passport ? { passport: currentFilters.passport } : {}),
        ...(currentFilters.countryId ? { countryId: currentFilters.countryId } : {}),
        ...(currentFilters.groupId ? { groupId: currentFilters.groupId } : {}),
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
    debounce(
      (searchQuery, currentFilters) => fetchData(searchQuery, currentFilters),
      300
    ),
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
