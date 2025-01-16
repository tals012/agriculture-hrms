"use client";

import { useEffect, useState, useCallback } from "react";
import ScreenFilter from "@/components/screenFilter";
import ScreenHead from "@/components/screenHead";
import Table from "@/containers/clients/table";
import CreateClient from "@/smallModals/client/createClient";
import { ToastContainer } from "react-toastify";
import getClients from "@/app/(backend)/actions/clients/getClients";
import Spinner from "@/components/spinner";
import getClientsStats from "@/app/(backend)/actions/clients/getClientsStats";
import { debounce } from "@/lib/debounce";
import { useRouter } from "next/navigation";
import { getCookie } from "@/lib/getCookie";
import styles from "@/styles/screens/clients.module.scss";
import Client from "@/bigModals/client";
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
          ]}
          value={
            filters.status
              ? {
                  value: filters.status,
                  label: filters.status === "ACTIVE" ? "פעיל" : "לא פעיל",
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

export default function Clients() {
  const router = useRouter();
  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const [isModalOpen, setModalOpen] = useState(false);
  const [clientId, setClientId] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createStatus, setCreateStatus] = useState(null);
  const [stats, setStats] = useState({
    totalClientsCount: 0,
    newClientsCount: 0,
    activeClientsCount: 0,
    inactiveClientsCount: 0,
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

      // Ensure payload is not null
      const payload = {
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(currentFilters.name ? { name: currentFilters.name } : {}),
        ...(currentFilters.status ? { status: currentFilters.status } : {}),
        ...(currentFilters.phone ? { phone: currentFilters.phone } : {}),
      };

      const res = await getClients(payload);

      if (res?.status === 200) {
        setClients(res.data || []);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
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
        const res = await getClientsStats();
        if (res?.status === 200) {
          setStats(
            res.data || {
              totalClientsCount: 0,
              newClientsCount: 0,
              activeClientsCount: 0,
              inactiveClientsCount: 0,
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
          title="לקוחות"
          count={stats?.totalClientsCount}
          desc="כאן תוכל לראות את כל הלקוחות שלך"
          stats={[
            {
              value: stats?.newClientsCount,
              text: "לקוחות חדשים",
            },
            {
              value: stats?.activeClientsCount,
              text: "עובדים פעילים",
            },
            {
              value: stats?.inactiveClientsCount,
              text: "משימות לביצוע",
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
            createText="הוספת לקוח"
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
          <Table data={clients} setClientId={setClientId} />
        )}
      </div>
      <Client isOpen={clientId} onClose={() => setClientId(false)} />
      {isCreateModalOpen && (
        <CreateClient
          setModalOpen={setIsCreateModalOpen}
          setCreateStatus={setCreateStatus}
        />
      )}
      <ToastContainer />
    </div>
  );
}
