"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/components/pdfEditor.module.scss";

const Dictionary = ({ searchQuery, setSearchQuery, filteredDictionary, handleAddField, onClose }) => {
  // Default position from the right side (for RTL layout)
  const [position, setPosition] = useState({ right: 20, top: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  // Handle mouse down to start dragging
  const handleMouseDown = (e) => {
    if (e.target.closest(`.${styles.panelHeader}`)) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  // Handle mouse move when dragging
  const handleMouseMove = (e) => {
    if (isDragging) {
      // For RTL we position from the right side
      const windowWidth = window.innerWidth;
      const right = windowWidth - e.clientX - (280 - dragOffset.x); // 280px is panel width
      
      setPosition({
        right: right > 0 ? right : 0,
        top: e.clientY - dragOffset.y > 0 ? e.clientY - dragOffset.y : 0
      });
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className={styles.dictionaryPortal}>
      <div
        ref={panelRef}
        className={styles.dictionaryPanel}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          right: `${position.right}px`,
          width: "280px",
          zIndex: 9999,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          cursor: isDragging ? "grabbing" : "auto"
        }}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.panelHeader} style={{ cursor: "grab" }}>
          <div>מילון שדות</div>
          <div
            style={{ cursor: "pointer" }}
            onClick={onClose}
          >
            ✖
          </div>
        </div>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="חיפוש שדה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.dictionaryList}>
          {filteredDictionary.map((field) => (
            <div
              key={field.key}
              className={styles.dictionaryItem}
              onClick={() => handleAddField(field.key)}
            >
              <span className={styles.fieldLabel}>{field.label}</span>
              <span className={styles.fieldKey}>{field.key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dictionary; 