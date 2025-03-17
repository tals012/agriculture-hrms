import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Spinner from "@/components/spinner";
import { getWorkerTemplates } from "@/app/(backend)/actions/workers/documentTemplate/getWorkerTemplates";

function TemplatesDropdown({ selectedTemplate, onChange }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const templates = await getWorkerTemplates();
        console.log(templates, "--- templates ---");
        if (!templates.ok) {
          toast.error("שגיאה בטעינת המסמכים", {
            position: "top-center",
          });
        } else {
          setTemplates(templates.data);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <select
        value={selectedTemplate.id}
        onChange={(e) => {
          onChange(
            e.target.value,
            templates.find((t) => t.id === e.target.value)?.link
          );
        }}
      >
        <option>נא לבחור מסמך</option>
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
