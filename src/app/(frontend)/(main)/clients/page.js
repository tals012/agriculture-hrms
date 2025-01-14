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
import ReactSelect from "react-select";
import TextField from "@/components/textField";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getCookie } from "@/lib/getCookie";
import styles from "@/styles/screens/clients.module.scss";

export default function Clients() {
  const router = useRouter();
  useEffect(() => {
    let token = getCookie("token");
    if (!token) {
      router.push("/login");
    }
  }, []);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createStatus, setCreateStatus] = useState(null);
  const [stats, setStats] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    status: "",
    phone: "",
  });

  // * fetch clients
  const fetchData = async (searchQuery, filters) => {
    try {
      setLoading(true);
      let payload = {
        search: searchQuery,
        name: filters.name,
        status: filters.status,
        phone: filters.phone,
      };
      const res = await getClients({ payload });
      const { data, status } = res;
      if (status === 200) {
        setClients(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchData = useCallback(debounce(fetchData, 300), []);

  useEffect(() => {
    setCreateStatus(null);
    debouncedFetchData(search, filters);
  }, [search, createStatus, debouncedFetchData]);

  // * fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getClientsStats();
        const { data, status } = res;
        if (status === 200) {
          setStats({
            totalClientsCount: data.totalClientsCount,
            newClientsCount: data.newClientsCount,
            activeClientsCount: data.activeClientsCount,
            inactiveClientsCount: data.inactiveClientsCount,
          });
        }
      } catch (error) {
        console.log(error);
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
          <Table setModalOpen={setModalOpen} data={clients} />
        )}
      </div>

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

// * filter box
const FilterBox = ({ setIsOpen, filters, setFilters, handleSearch }) => {
  const selectStyle = {
    control: (baseStyles, state) => ({
      ...baseStyles,
      width: "100%",
      border: "1px solid #E6E6E6",
      height: "44px",
      fontSize: "14px",
      color: "#999FA5",
      borderRadius: "6px",
      background: "transparent",
      zIndex: 999999,
    }),
    menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
    menu: (provided) => ({ ...provided, zIndex: 9999 }),
  };

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      name: "",
      status: "",
      phone: "",
    });
  };

  return (
    <div className={styles.filterBox}>
      <div className={styles.header}>
        <div className={styles.right}>
          <h2>סינון</h2>
          <p onClick={handleClearFilters}>נקה סינון</p>
        </div>

        <Image
          src="/assets/icons/cross-2.svg"
          alt="cross"
          width={24}
          height={24}
          onClick={() => setIsOpen(false)}
        />
      </div>

      <div className={styles.fields}>
        <TextField
          label="שם הלקוח"
          width="100%"
          value={filters.name}
          onChange={(e) => handleFilterChange("name", e.target.value)}
        />
        <TextField
          label="טלפון"
          width="100%"
          value={filters.phone}
          onChange={(e) => handleFilterChange("phone", e.target.value)}
        />
        <ReactSelect
          options={[
            {
              value: "ACTIVE",
              label: "פעיל",
            },
            {
              value: "INACTIVE",
              label: "לא פעיל",
            },
          ]}
          components={{
            IndicatorSeparator: () => null,
          }}
          placeholder="סטטוס לקוח"
          name="status"
          value={
            filters.status
              ? {
                  value: filters.status,
                  label: filters.status === "ACTIVE" ? "פעיל" : "לא פעיל",
                }
              : null
          }
          onChange={(option) =>
            handleFilterChange("status", option ? option.value : "")
          }
          menuPortalTarget={document.body}
          menuPosition={"fixed"}
          styles={selectStyle}
        />
        <button onClick={handleSearch}>חיפוש</button>
      </div>
    </div>
  );
};
