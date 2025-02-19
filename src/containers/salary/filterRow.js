"use client";

import { useState, useEffect } from "react";
import ReactSelect from "react-select";
import styles from "@/styles/containers/salary/filterRow.module.scss";
import getClients from "@/app/(backend)/actions/clients/getClients";
import getFields from "@/app/(backend)/actions/fields/getFields";
import getGroups from "@/app/(backend)/actions/groups/getGroups";
import getWorkers from "@/app/(backend)/actions/workers/getWorkers";

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

// Create styles with different z-index values
const monthSelectStyle = createSelectStyle(7000);
const yearSelectStyle = createSelectStyle(6000);
const clientSelectStyle = createSelectStyle(5000);
const fieldSelectStyle = createSelectStyle(4000);
const groupSelectStyle = createSelectStyle(3000);
const workerSelectStyle = createSelectStyle(2000);

const FilterRow = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    month: { value: new Date().getMonth() + 1, label: months[new Date().getMonth()].label },
    year: { value: currentYear, label: String(currentYear) },
    selectedClient: null,
    selectedField: null,
    selectedGroup: null,
    selectedWorker: null,
  });

  const [options, setOptions] = useState({
    clients: [],
    fields: [],
    groups: [],
    workers: [],
  });

  const [loading, setLoading] = useState({
    clients: false,
    fields: false,
    groups: false,
    workers: false,
    submit: false,
  });

  useEffect(() => {
    const loadClients = async () => {
      setLoading(prev => ({ ...prev, clients: true }));
      try {
        const response = await getClients();
        if (response.status === 200) {
          setOptions(prev => ({
            ...prev,
            clients: response.data.map(client => ({
              value: client.id,
              label: client.name
            }))
          }));
        }
      } finally {
        setLoading(prev => ({ ...prev, clients: false }));
      }
    };

    loadClients();
  }, []);

  useEffect(() => {
    if (!filters.selectedClient) {
      setOptions(prev => ({ ...prev, fields: [] }));
      return;
    }

    const loadFields = async () => {
      setLoading(prev => ({ ...prev, fields: true }));
      try {
        const response = await getFields({ clientId: filters.selectedClient.value });
        if (response.status === 200) {
          setOptions(prev => ({
            ...prev,
            fields: response.data.map(field => ({
              value: field.id,
              label: field.name
            }))
          }));
        }
      } finally {
        setLoading(prev => ({ ...prev, fields: false }));
      }
    };

    loadFields();
  }, [filters.selectedClient]);

  useEffect(() => {
    if (!filters.selectedClient) {
      setOptions(prev => ({ ...prev, groups: [] }));
      return;
    }

    const loadGroups = async () => {
      setLoading(prev => ({ ...prev, groups: true }));
      try {
        const response = await getGroups({ 
          clientId: filters.selectedClient.value,
          ...(filters.selectedField ? { fieldId: filters.selectedField.value } : {})
        });
        if (response.status === 200) {
          setOptions(prev => ({
            ...prev,
            groups: response.data.map(group => ({
              value: group.id,
              label: group.name
            }))
          }));
        }
      } finally {
        setLoading(prev => ({ ...prev, groups: false }));
      }
    };

    loadGroups();
  }, [filters.selectedClient, filters.selectedField]);

  useEffect(() => {
    const loadWorkers = async () => {
      setLoading(prev => ({ ...prev, workers: true }));
      try {
        const response = await getWorkers({
          clientId: filters.selectedClient?.value,
          ...(filters.selectedField ? { fieldId: filters.selectedField.value } : {}),
          ...(filters.selectedGroup ? { groupId: filters.selectedGroup.value } : {})
        });
        if (response.status === 200) {
          console.log("Workers response:", response.data);
          setOptions(prev => ({
            ...prev,
            workers: response.data.map(worker => {
              const fullName = `${worker.nameHe || ''} ${worker.surnameHe || ''}`.trim();
              const label = worker.passport ? 
                `${fullName} - ${worker.passport}` :
                fullName;
              return {
                value: worker.id,
                label: label || 'עובד ללא שם'
              };
            })
          }));
        }
      } finally {
        setLoading(prev => ({ ...prev, workers: false }));
      }
    };

    if (filters.selectedClient) {
      loadWorkers();
    } else {
      setOptions(prev => ({ ...prev, workers: [] }));
    }
  }, [filters.selectedClient, filters.selectedField, filters.selectedGroup]);

  const handleFilterChange = (value, field) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // Reset dependent fields
      if (field === 'selectedClient') {
        newFilters.selectedField = null;
        newFilters.selectedGroup = null;
        newFilters.selectedWorker = null;
      } else if (field === 'selectedField' || field === 'selectedGroup') {
        newFilters.selectedWorker = null;
      }
      
      return newFilters;
    });
  };

  const handleSubmit = async () => {
    if (!filters.month || !filters.year) {
      return;
    }

    setLoading(prev => ({ ...prev, submit: true }));
    try {
      await onFilterChange({
        month: filters.month.value,
        year: filters.year.value,
        clientId: filters.selectedClient?.value,
        fieldId: filters.selectedField?.value,
        groupId: filters.selectedGroup?.value,
        workerId: filters.selectedWorker?.value,
      });
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
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
            isRequired
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
            isRequired
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
            options={options.clients}
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
            options={options.fields}
            isLoading={loading.fields}
            value={filters.selectedField}
            onChange={(option) => handleFilterChange(option, 'selectedField')}
            placeholder="בחר שדה"
            isDisabled={!filters.selectedClient}
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={fieldSelectStyle}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
          />
          <ReactSelect
            options={options.groups}
            isLoading={loading.groups}
            value={filters.selectedGroup}
            onChange={(option) => handleFilterChange(option, 'selectedGroup')}
            placeholder="בחר קבוצה"
            isDisabled={!filters.selectedClient}
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={groupSelectStyle}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
          />
          <ReactSelect
            options={options.workers}
            isLoading={loading.workers}
            value={filters.selectedWorker}
            onChange={(option) => handleFilterChange(option, 'selectedWorker')}
            placeholder="בחר עובד"
            isDisabled={!filters.selectedClient}
            components={{
              IndicatorSeparator: () => null,
            }}
            styles={workerSelectStyle}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
          />
        </div>

        <button 
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={loading.submit || !filters.month || !filters.year}
        >
          {loading.submit ? "טוען..." : "הצג"}
        </button>
      </div>
    </div>
  );
};

export default FilterRow;
