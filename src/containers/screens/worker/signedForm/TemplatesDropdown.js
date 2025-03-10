"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Spinner from "@/components/spinner";
import { getWorkerTemplatesForForms } from "@/app/(backend)/actions/workers/documentTemplate/getWorkerTemplatesForForms";

function TemplatesDropdown({ selectedTemplate, onChange }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await getWorkerTemplatesForForms();
        
        if (!response.ok) {
          toast.error("Failed to load templates");
        } else {
          setTemplates(response.data);
        }
      } catch (error) {
        console.error("Error loading templates:", error);
        toast.error("Failed to load templates");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <select
        value={selectedTemplate.id || ""}
        onChange={(e) => {
          const template = templates.find(t => t.id === e.target.value);
          if (template) {
            onChange(template.id, template.link, template.name);
          }
        }}
        className="p-2 border border-gray-300 rounded-md min-w-[200px]"
      >
        <option value="">נא לבחור מסמך</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default TemplatesDropdown; 