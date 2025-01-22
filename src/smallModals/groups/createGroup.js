"use client";

import { useState, useEffect } from "react";
import { createGroup } from "@/app/(backend)/actions/groups/createGroup";
import getClients from "@/app/(backend)/actions/clients/getClients";
import getFields from "@/app/(backend)/actions/fields/getFields";
import getWorkers from "@/app/(backend)/actions/workers/getWorkers";
import getPricing from "@/app/(backend)/actions/clients/getPricing";
import { toast } from "react-toastify";
import Image from "next/image";
import TextField from "@/components/textField";
import ReactSelect from "react-select";
import Spinner from "@/components/spinner";
import styles from "@/styles/smallModals/group/createGroup.module.scss";

export default function CreateGroup({ setModalOpen, setCreateStatus }) {
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
      position: "absolute",
      width: "100%",
      backgroundColor: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      zIndex: 99999,
    }),
    menuPortal: (baseStyles) => ({
      ...baseStyles,
      zIndex: 99999,
    }),
    multiValue: (baseStyles) => ({
      ...baseStyles,
      backgroundColor: "#E6E6E6",
    }),
  };

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [fieldId, setFieldId] = useState("");
  const [leaderWorkerId, setLeaderWorkerId] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [workersSearch, setWorkersSearch] = useState("");
  const [selectedPricingCombinations, setSelectedPricingCombinations] = useState([]);

  // Data states
  const [clients, setClients] = useState([]);
  const [fields, setFields] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [pricingCombinations, setPricingCombinations] = useState([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);

  const availableWorkers = workers
    .filter(worker => worker.id !== leaderWorkerId)
    .filter(worker => {
      if (!workersSearch) return true;
      const searchLower = workersSearch.toLowerCase();
      const nameMatch = worker.name?.toLowerCase().includes(searchLower);
      const surnameMatch = worker.surname?.toLowerCase().includes(searchLower);
      const nameHeMatch = worker.nameHe?.toLowerCase().includes(searchLower);
      return nameMatch || surnameMatch || nameHeMatch;
    });

  const handleWorkerToggle = (workerId) => {
    setSelectedWorkers(prev => {
      const isSelected = prev.some(w => w.value === workerId);
      if (isSelected) {
        return prev.filter(w => w.value !== workerId);
      } else {
        const worker = workers.find(w => w.id === workerId);
        return [...prev, {
          value: workerId,
          label: worker.nameHe || `${worker.name} ${worker.surname}`
        }];
      }
    });
  };

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await getClients();
        if (res?.status === 200) {
          setClients(res.data);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to fetch clients", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    };

    fetchClients();
  }, []);

  // Fetch fields, workers, and pricing combinations when client changes
  useEffect(() => {
    const fetchFieldsAndWorkers = async () => {
      if (!selectedClient) {
        setFields([]);
        setWorkers([]);
        setPricingCombinations([]);
        setFieldId("");
        setLeaderWorkerId("");
        setSelectedWorkers([]);
        setSelectedPricingCombinations([]);
        return;
      }

      setIsLoadingFields(true);
      setIsLoadingWorkers(true);
      setIsLoadingPricing(true);

      try {
        // Fetch fields
        const fieldsRes = await getFields({ clientId: selectedClient.value });
        if (fieldsRes?.status === 200) {
          setFields(fieldsRes.data);
        }

        // Fetch workers
        const workersRes = await getWorkers({ clientId: selectedClient.value });
        if (workersRes?.status === 200) {
          setWorkers(workersRes.data);
        }

        // Fetch pricing combinations
        const pricingRes = await getPricing({ clientId: selectedClient.value });
        if (pricingRes?.status === 200) {
          setPricingCombinations(pricingRes.data);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch data", {
          position: "top-center",
          autoClose: 3000,
        });
      } finally {
        setIsLoadingFields(false);
        setIsLoadingWorkers(false);
        setIsLoadingPricing(false);
      }
    };

    fetchFieldsAndWorkers();
  }, [selectedClient]);

  const handleCreate = async () => {
    try {
      if (!name.trim()) {
        toast.error("שם הקבוצה הוא שדה חובה", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      if (!selectedClient) {
        toast.error("יש לבחור לקוח", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      if (!fieldId) {
        toast.error("יש לבחור שדה", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      if (!leaderWorkerId) {
        toast.error("יש לבחור מנהל קבוצה", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      setLoading(true);
      const res = await createGroup({
        name,
        description,
        fieldId,
        leaderWorkerId,
        workerIds: selectedWorkers.map(w => w.value),
        clientPricingCombinationIds: selectedPricingCombinations.map(p => p.value)
      });

      if (res?.status === 201) {
        toast.success(res.message, {
          position: "top-center",
          autoClose: 3000,
        });
        setCreateStatus(Date.now());
        setModalOpen(false);
      } else {
        if (res?.errors) {
          res.errors.forEach(error => {
            toast.error(`${error.field}: ${error.message}`, {
              position: "top-center",
              autoClose: 3000,
            });
          });
        } else {
          toast.error(res?.message || "Failed to create group", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <Image
            src="/assets/icons/cross-2.svg"
            alt="cross-icon"
            width={20}
            height={20}
            className={styles.closeIcon}
            onClick={() => setModalOpen(false)}
          />
        </div>

        <div className={styles.content}>
          <h2>יצירת קבוצה</h2>

          <div className={styles.fields}>
            <TextField
              label="שם הקבוצה"
              width="48.3%"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div style={{ width: "48.3%" }}>
              <ReactSelect
                options={clients.map(client => ({
                  value: client.id,
                  label: client.name
                }))}
                components={{
                  IndicatorSeparator: () => null,
                }}
                placeholder="לקוח"
                value={selectedClient}
                onChange={(option) => {
                  setSelectedClient(option);
                  setFieldId("");
                  setLeaderWorkerId("");
                  setSelectedWorkers([]);
                }}
                styles={selectStyle}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>

            {selectedClient && (
              <>
                <div style={{ width: "48.3%" }}>
                  <ReactSelect
                    options={fields.map(field => ({
                      value: field.id,
                      label: field.name
                    }))}
                    components={{
                      IndicatorSeparator: () => null,
                    }}
                    placeholder="שדה"
                    name="fieldId"
                    value={
                      fieldId
                        ? {
                            value: fieldId,
                            label: fields.find((i) => i.id === fieldId)?.name,
                          }
                        : null
                    }
                    onChange={(option) => setFieldId(option ? option.value : null)}
                    styles={selectStyle}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    isDisabled={isLoadingFields}
                    isLoading={isLoadingFields}
                  />
                </div>

                <div style={{ width: "48.3%" }}>
                  <ReactSelect
                    options={workers.map(worker => ({
                      value: worker.id,
                      label: worker.nameHe || `${worker.name} ${worker.surname}`
                    }))}
                    components={{
                      IndicatorSeparator: () => null,
                    }}
                    placeholder="מנהל קבוצה"
                    name="leaderWorkerId"
                    value={
                      leaderWorkerId
                        ? {
                            value: leaderWorkerId,
                            label: workers.find((w) => w.id === leaderWorkerId)?.nameHe || 
                                   `${workers.find((w) => w.id === leaderWorkerId)?.name} ${workers.find((w) => w.id === leaderWorkerId)?.surname}`,
                          }
                        : null
                    }
                    onChange={(option) => {
                      setLeaderWorkerId(option ? option.value : null);
                      // Remove the leader from selected workers if present
                      setSelectedWorkers(prev => prev.filter(w => w.value !== option?.value));
                    }}
                    styles={selectStyle}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    isDisabled={isLoadingWorkers}
                    isLoading={isLoadingWorkers}
                  />
                </div>

                <div className={styles.workersSection}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="חיפוש עובדים..."
                    value={workersSearch}
                    onChange={(e) => setWorkersSearch(e.target.value)}
                    disabled={isLoadingWorkers}
                  />
                  <div className={styles.workersList}>
                    {isLoadingWorkers ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                        <Spinner size={20} />
                      </div>
                    ) : availableWorkers.map(worker => (
                      <div 
                        key={worker.id} 
                        className={styles.workerItem}
                        onClick={() => handleWorkerToggle(worker.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedWorkers.some(w => w.value === worker.id)}
                          onChange={() => {}}
                          disabled={isLoadingWorkers}
                        />
                        <span className={styles.workerName}>
                          {worker.nameHe || `${worker.name} ${worker.surname}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ width: "100%" }}>
                  <ReactSelect
                    isMulti
                    options={pricingCombinations.map(pricing => ({
                      value: pricing.id,
                      label: `${pricing.species.name} - ${pricing.harvestType.name} - ${pricing.price}₪`
                    }))}
                    components={{
                      IndicatorSeparator: () => null,
                    }}
                    placeholder="תמחור"
                    value={selectedPricingCombinations}
                    onChange={setSelectedPricingCombinations}
                    styles={selectStyle}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    isDisabled={isLoadingPricing}
                    isLoading={isLoadingPricing}
                  />
                </div>
              </>
            )}

            <TextField
              label="תיאור"
              width="100%"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
            />

            <button
              onClick={handleCreate}
              disabled={loading || !name || !selectedClient || !fieldId || !leaderWorkerId}
            >
              {loading ? <Spinner color="#ffffff" /> : "יצירה"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 