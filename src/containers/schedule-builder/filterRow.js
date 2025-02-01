"use client";

import { useState, useEffect } from "react";
import ReactSelect from "react-select";
import styles from "@/styles/containers/schedule-builder/filterRow.module.scss";
import getWorkers from "@/app/(backend)/actions/workers/getWorkers";
import getClients from "@/app/(backend)/actions/clients/getClients";
import { getGroups } from "@/app/(backend)/actions/groups/getGroups";

const months = [
  { value: 1, label: "ינואר" },
  { value: 2, label: "פברואר" },
  { value: 3, label: "מרץ" },
  { value: 4, label: "אפריל" },
  { value: 5, label: "מאי" },
  { value: 6, label: "יוני" },
  { value: 7, label: "יולי" },
  { value: 8, label: "אוגוסט" },
  { value: 9, label: "ספטמבר" },
  { value: 10, label: "אוקטובר" },
  { value: 11, label: "נובמבר" },
  { value: 12, label: "דצמבר" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => ({
  value: currentYear + i,
  label: String(currentYear + i),
}));

const createSelectStyle = (zIndex) => ({
  control: (baseStyles, state) => ({
    ...baseStyles,
    width: "100%",
    border: "1px solid #E6E6E6",
    height: "44px",
    fontSize: "14px",
    color: "#999FA5",
    borderRadius: "6px",
    background: "transparent",
    zIndex,
  }),
  menuPortal: (provided) => ({ 
    ...provided, 
    zIndex: zIndex + 1000 
  }),
  menu: (provided) => ({ 
    ...provided, 
    zIndex: zIndex + 1000 
  }),
});

// Create styles with different z-index values and larger gaps
const monthSelectStyle = createSelectStyle(9000);
const yearSelectStyle = createSelectStyle(8000);
const clientSelectStyle = createSelectStyle(7000);
const groupSelectStyle = createSelectStyle(6000);
const workerSelectStyle = createSelectStyle(5000);

const FilterRow = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    month: { value: new Date().getMonth() + 1, label: months[new Date().getMonth()].label },
    year: { value: currentYear, label: String(currentYear) },
    selectedClient: null,
    selectedGroup: null,
    selectedWorker: null,
  });

  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState({
    clients: false,
    groups: false,
    workers: false,
  });

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(prev => ({ ...prev, clients: true }));
      try {
        const response = await getClients();
        if (response.status === 200) {
          setClients(response.data.map(client => ({
            value: client.id,
            label: client.name,
            data: client
          })));
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(prev => ({ ...prev, clients: false }));
      }
    };

    fetchClients();
  }, []);

  // Fetch groups when client is selected
  useEffect(() => {
    const fetchGroups = async () => {
      if (!filters.selectedClient) {
        setGroups([]);
        return;
      }

      setLoading(prev => ({ ...prev, groups: true }));
      try {
        const response = await getGroups({
          clientId: filters.selectedClient.value
        });
        if (response.status === 200) {
          setGroups(response.data.map(group => ({
            value: group.id,
            label: group.name,
            data: group
          })));
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(prev => ({ ...prev, groups: false }));
      }
    };

    fetchGroups();
  }, [filters.selectedClient]);

  // Fetch workers when client is selected
  useEffect(() => {
    const fetchWorkers = async () => {
      if (!filters.selectedClient) {
        setWorkers([]);
        return;
      }

      setLoading(prev => ({ ...prev, workers: true }));
      try {
        const response = await getWorkers({
          clientId: filters.selectedClient.value
        });
        if (response.status === 200) {
          setWorkers(response.data.map(worker => ({
            value: worker.id,
            label: `${worker.name} ${worker.surname || ""}`.trim(),
            data: worker
          })));
        }
      } catch (error) {
        console.error("Error fetching workers:", error);
      } finally {
        setLoading(prev => ({ ...prev, workers: false }));
      }
    };

    fetchWorkers();
  }, [filters.selectedClient]);

  const handleFilterChange = (value, field) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);

    // Reset dependent fields when client changes
    if (field === 'selectedClient') {
      newFilters.selectedGroup = null;
      newFilters.selectedWorker = null;
    }

    onFilterChange({
      month: newFilters.month.value,
      year: newFilters.year.value,
      clientId: newFilters.selectedClient?.value,
      groupId: newFilters.selectedGroup?.value,
      workerId: newFilters.selectedWorker?.value,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <div className={styles.dateFilters}>
          <ReactSelect
            options={months}
            value={filters.month}
            onChange={(option) => handleFilterChange(option, 'month')}
            placeholder="חודש"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={monthSelectStyle}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
          />
          <ReactSelect
            options={years}
            value={filters.year}
            onChange={(option) => handleFilterChange(option, 'year')}
            placeholder="שנה"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={yearSelectStyle}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
          />
        </div>

        <div className={styles.entityFilters}>
          <ReactSelect
            options={clients}
            isLoading={loading.clients}
            value={filters.selectedClient}
            onChange={(option) => handleFilterChange(option, 'selectedClient')}
            placeholder="בחר לקוח"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={clientSelectStyle}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
          />
          <ReactSelect
            options={groups}
            isLoading={loading.groups}
            isDisabled={!filters.selectedClient}
            value={filters.selectedGroup}
            onChange={(option) => handleFilterChange(option, 'selectedGroup')}
            placeholder="בחר קבוצה"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={groupSelectStyle}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
          />
          <ReactSelect
            options={workers}
            isLoading={loading.workers}
            isDisabled={!filters.selectedClient}
            value={filters.selectedWorker}
            onChange={(option) => handleFilterChange(option, 'selectedWorker')}
            placeholder="בחר עובד"
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={workerSelectStyle}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterRow;
