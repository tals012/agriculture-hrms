"use client";

import styles from "@/styles/containers/settings/harvestTypes.module.scss";
import { useState, useEffect } from "react";
import { IoSearch, IoAdd } from "react-icons/io5";
import CreateHarvestType from "./createHarvestType";
import { getHarvestTypes } from "@/app/(backend)/actions/misc/harvestTypes/getHarvestTypes";
import { deleteHarvestType } from "@/app/(backend)/actions/misc/harvestTypes/deleteHarvestType";
import { toast } from "react-toastify";
import Spinner from "@/components/spinner";

const HarvestTypes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [harvestTypes, setHarvestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const fetchHarvestTypes = async () => {
    setLoading(true);
    const response = await getHarvestTypes();
    if (response.error) {
      toast.error(response.error, {
        rtl: true,
      });
    } else {
      setHarvestTypes(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHarvestTypes();
  }, []);

  const handleCreateSubmit = async (data) => {
    setShowCreateModal(false);
    await fetchHarvestTypes();
  };

  const handleEditSubmit = async (data) => {
    setEditingType(null);
    await fetchHarvestTypes();
  };

  const handleDelete = async (id) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק סוג קטיף זה?")) return;

    setDeleteLoading(id);
    const response = await deleteHarvestType({ id });
    if (response.error) {
      toast.error(response.error, {
        rtl: true,
      });
    } else {
      toast.success("סוג הקטיף נמחק בהצלחה", {
        rtl: true,
      });
      await fetchHarvestTypes();
    }
    setDeleteLoading(null);
  };

  const filteredHarvestTypes = harvestTypes.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchBox}>
          <IoSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="חיפוש סוגי קטיף..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className={styles.addButton} onClick={() => setShowCreateModal(true)}>
          <IoAdd />
          הוסף סוג קטיף חדש
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>שם</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filteredHarvestTypes.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      className={styles.editButton}
                      onClick={() => setEditingType(item)}
                    >
                      ערוך
                    </button>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteLoading === item.id}
                    >
                      {deleteLoading === item.id ? (
                        <Spinner size={14} color="#e11d48" />
                      ) : (
                        "מחק"
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateHarvestType
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {editingType && (
        <CreateHarvestType
          isEdit
          initialData={editingType}
          onClose={() => setEditingType(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default HarvestTypes;
