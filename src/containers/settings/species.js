"use client";

import styles from "@/styles/containers/settings/species.module.scss";
import { useState, useEffect } from "react";
import { IoSearch, IoAdd } from "react-icons/io5";
import CreateSpecies from "./createSpecies";
import { getSpecies } from "@/app/(backend)/actions/misc/species/getSpecies";
import { deleteSpecies } from "@/app/(backend)/actions/misc/species/deleteSpecies";
import { toast } from "react-toastify";
import Spinner from "@/components/spinner";

const Species = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState(null);
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const fetchSpecies = async () => {
    setLoading(true);
    const response = await getSpecies();
    if (response.error) {
      toast.error(response.error, {
        rtl: true,
      });
    } else {
      setSpecies(response.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSpecies();
  }, []);

  const handleCreateSubmit = async (data) => {
    setShowCreateModal(false);
    await fetchSpecies();
  };

  const handleEditSubmit = async (data) => {
    setEditingSpecies(null);
    await fetchSpecies();
  };

  const handleDelete = async (id) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק מין זה?")) return;

    setDeleteLoading(id);
    const response = await deleteSpecies({ id });
    if (response.error) {
      toast.error(response.error, {
        rtl: true,
      });
    } else {
      toast.success("המין נמחק בהצלחה", {
        rtl: true,
      });
      await fetchSpecies();
    }
    setDeleteLoading(null);
  };

  const filteredSpecies = species.filter((item) =>
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
            placeholder="חיפוש מינים..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className={styles.addButton} onClick={() => setShowCreateModal(true)}>
          <IoAdd />
          הוסף מין חדש
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
            {filteredSpecies.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      className={styles.editButton}
                      onClick={() => setEditingSpecies(item)}
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
        <CreateSpecies
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {editingSpecies && (
        <CreateSpecies
          isEdit
          initialData={editingSpecies}
          onClose={() => setEditingSpecies(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default Species;
