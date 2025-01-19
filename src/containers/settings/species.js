"use client";

import styles from "@/styles/containers/settings/species.module.scss";
import { useState } from "react";
import { IoSearch, IoAdd } from "react-icons/io5";
import CreateSpecies from "./createSpecies";

const Species = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState(null);

  // Dummy data - replace with real data later
  const species = [
    { id: 1, name: "תפוח" },
    { id: 2, name: "עגבניה" },
    { id: 3, name: "מלפפון" },
  ];

  const handleCreateSubmit = (data) => {
    // Handle creation here
    console.log("Creating species:", data);
    setShowCreateModal(false);
  };

  const handleEditSubmit = (data) => {
    // Handle edit here
    console.log("Editing species:", { ...data, id: editingSpecies.id });
    setEditingSpecies(null);
  };

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
            {species.map((item) => (
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
                    <button className={styles.deleteButton}>מחק</button>
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
