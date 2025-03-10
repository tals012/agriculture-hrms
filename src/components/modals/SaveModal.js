"use client";

import React from "react";
import Modal from "@/components/modal";
import Spinner from "@/components/spinner";

/**
 * SaveModal Component
 * 
 * A modal for saving document details such as name, category, and notes
 */
const SaveModal = ({
  isOpen,
  onClose,
  onSave,
  title = "Save Document",
  isLoading = false,
  fields = {},
  setFields = () => {},
  categories = [],
}) => {
  // Create category options from categories prop
  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name || "Unnamed Category",
  }));

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={() => {
        if (!isLoading) onClose();
      }}
    >
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Name
          </label>
          <input
            type="text"
            value={fields.name}
            onChange={(e) => setFields(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={fields.category}
            onChange={(e) => setFields(prev => ({ ...prev, category: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={isLoading}
          >
            <option value="">Select Category</option>
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={fields.note}
            onChange={(e) => setFields(prev => ({ ...prev, note: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
            disabled={isLoading}
          />
        </div>
        
        <button
          onClick={onSave}
          disabled={isLoading || !fields.name}
          className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              <span>Saving...</span>
            </>
          ) : (
            "Save Document"
          )}
        </button>
      </div>
    </Modal>
  );
};

export default SaveModal; 