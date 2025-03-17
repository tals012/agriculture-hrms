"use client";

import { useState } from "react";
import { createGroup } from "@/app/(backend)/actions/groups/createGroup";
import { toast } from "react-toastify";
import Image from "next/image";
import TextField from "@/components/textField";
import ReactSelect from "react-select";
import Spinner from "@/components/spinner";
import styles from "@/styles/smallModals/client/createClient.module.scss";

export default function CreateGroup({ 
  setModalOpen, 
  setCreateStatus, 
  clientId, 
  fields = [], 
  workers = [],
  pricingCombinations = []
}) {
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
  const [fieldId, setFieldId] = useState("");
  const [leaderWorkerId, setLeaderWorkerId] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [selectedPricingCombinations, setSelectedPricingCombinations] = useState([]);

  // Filter out leader worker from workers dropdown options
  const availableWorkers = workers.filter(worker => worker.id !== leaderWorkerId);

  const handleCreate = async () => {
    try {
      if (!name.trim()) {
        toast.error("שם הקבוצה הוא שדה חובה", {
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

      // if (!leaderWorkerId) {
      //   toast.error("יש לבחור מנהל קבוצה", {
      //     position: "top-center",
      //     autoClose: 3000,
      //   });
      //   return;
      // }

      setLoading(true);
      const res = await createGroup({
        name,
        description,
        fieldId,
        // leaderWorkerId,
        ...(leaderWorkerId && { leaderWorkerId }),
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
                        label: fields.find((i) => i.id === fieldId).name,
                      }
                    : null
                }
                onChange={(option) => setFieldId(option ? option.value : null)}
                styles={selectStyle}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>

            <div style={{ width: "48.3%" }}>
              <ReactSelect
                options={workers.map(worker => ({
                  value: worker.id,
                  label: worker.nameHe
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
                        label: workers.find((w) => w.id === leaderWorkerId).nameHe,
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
              />
            </div>

            <div style={{ width: "48.3%" }}>
              <ReactSelect
                isMulti
                options={availableWorkers.map(worker => ({
                  value: worker.id,
                  label: worker.nameHe
                }))}
                components={{
                  IndicatorSeparator: () => null,
                }}
                placeholder="עובדים"
                value={selectedWorkers}
                onChange={setSelectedWorkers}
                styles={selectStyle}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
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
              />
            </div>

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
              disabled={loading || !name || !fieldId}
            >
              {loading ? <Spinner color="#ffffff" /> : "יצירה"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 