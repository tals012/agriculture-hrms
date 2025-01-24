"use client";

import { useEffect, useState, useCallback } from "react";
import ScreenFilter from "@/components/screenFilter";
import ScreenHead from "@/components/screenHead";
import Table from "@/containers/groups/table";
import { ToastContainer } from "react-toastify";
import Spinner from "@/components/spinner";
import { debounce } from "@/lib/debounce";
import { useRouter } from "next/navigation";
import { getCookie } from "@/lib/getCookie";
import { getGroups } from "@/app/(backend)/actions/groups/getGroups";
import getGroupsStats from "@/app/(backend)/actions/groups/getGroupsStats";
import getClients from "@/app/(backend)/actions/clients/getClients";
import getFields from "@/app/(backend)/actions/fields/getFields";
import ReactSelect from "react-select";
import CreateGroup from "@/smallModals/groups/createGroup";
import Group from "@/bigModals/group";
import styles from "@/styles/screens/groups.module.scss";

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
  }),
  menu: (baseStyles) => ({
    ...baseStyles,
    backgroundColor: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    zIndex: 99999,
    position: "absolute",
    width: "100%",
    marginTop: 0,
  }),
  menuPortal: (baseStyles) => ({
    ...baseStyles,
    zIndex: 99999,
  }),
  option: (baseStyles, state) => ({
    ...baseStyles,
    backgroundColor: state.isSelected
      ? "#0066FF"
      : state.isFocused
      ? "#F5F5F5"
      : "white",
    color: state.isSelected ? "white" : "#333333",
    cursor: "pointer",
  }),
};

export default function Groups() {
  const router = useRouter();
  useEffect(() => {
    const token = getCookie("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const [groupId, setGroupId] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createStatus, setCreateStatus] = useState(null);
  const [stats, setStats] = useState({
    totalGroupsCount: 0,
    newGroupsCount: 0,
  });

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [clients, setClients] = useState([]);
  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  const fetchData = async (searchQuery = "") => {
    try {
      setLoading(true);

      const payload = {
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(selectedClient ? { clientId: selectedClient.value } : {}),
        ...(selectedField ? { fieldId: selectedField.value } : {}),
      };

      const res = await getGroups(payload);

      if (res?.status === 200) {
        setGroups(res.data || []);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchData = useCallback(
    debounce((searchQuery) => fetchData(searchQuery), 300),
    [selectedClient, selectedField]
  );

  useEffect(() => {
    debouncedFetchData(search);
  }, [search, selectedClient, selectedField, debouncedFetchData]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getGroupsStats();
        if (res?.status === 200) {
          setStats(
            res.data || {
              totalGroupsCount: 0,
              newGroupsCount: 0,
            }
          );
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [createStatus]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await getClients();
        if (res?.status === 200) {
          setClients(
            res.data.map((client) => ({
              value: client.id,
              label: client.name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setFieldsLoading(true);
        if (!selectedClient) {
          setFields([]);
          return;
        }

        const res = await getFields({ clientId: selectedClient.value });
        if (res?.status === 200) {
          setFields(
            res.data.map((field) => ({
              value: field.id,
              label: field.name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching fields:", error);
        setFields([]);
      } finally {
        setFieldsLoading(false);
      }
    };

    fetchFields();
  }, [selectedClient]);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead
          title="קבוצות"
          count={stats?.totalGroupsCount}
          desc="כאן תוכל לראות את כל הקבוצות שלך"
          stats={[
            {
              value: stats?.newGroupsCount,
              text: "קבוצות חדשות",
            },
          ]}
        />
        <div className={styles.screenFilterWrapper}>
          <ScreenFilter
            isSearch={true}
            filter={false}
            filterClickHandler={() => {}}
            setIsCreateModalOpen={setIsCreateModalOpen}
            search={search}
            setSearch={setSearch}
            createText="הוספת קבוצה"
          />
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterField}>
            <ReactSelect
              options={clients}
              components={{
                IndicatorSeparator: () => null,
              }}
              placeholder="בחר לקוח"
              value={selectedClient}
              onChange={(option) => {
                setSelectedClient(option);
                setSelectedField(null);
              }}
              styles={selectStyle}
              isClearable
              classNamePrefix="select"
            />
          </div>
          <div className={styles.filterField}>
            <ReactSelect
              options={fields}
              components={{
                IndicatorSeparator: () => null,
              }}
              placeholder="בחר שדה"
              value={selectedField}
              onChange={(option) => setSelectedField(option)}
              styles={selectStyle}
              isClearable
              isLoading={fieldsLoading}
              isDisabled={!selectedClient || fieldsLoading}
              classNamePrefix="select"
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.loader}>
            <Spinner size={30} />
          </div>
        ) : (
          <Table data={groups} setGroupId={setGroupId} />
        )}
      </div>
      <Group isOpen={groupId} onClose={() => setGroupId(false)} />
      {isCreateModalOpen && (
        <CreateGroup
          setModalOpen={setIsCreateModalOpen}
          setCreateStatus={setCreateStatus}
        />
      )}
      <ToastContainer />
    </div>
  );
}
