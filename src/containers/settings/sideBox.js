"use client";

import { useRouter, useSearchParams } from "next/navigation";
import styles from "@/styles/containers/settings/sideBox.module.scss";

const SideBox = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "organization";

  const items = [
    { id: "organization", label: "ארגון" },
    { id: "species", label: "מינים" },
    { id: "harvest-types", label: "סוגי קטיף" },
    // { id: "document-categories", label: "קטגוריות מסמכים" },
    // { id: "document-simple-categories", label: "קטגוריות פשוטות" },
    // { id: "document-template-categories", label: "קטגוריות תבניות" },
    { id: "document-management", label: "ניהול מסמכים" },
  ];

  const handleTabChange = (tabId) => {
    router.push(`/admin/settings?tab=${tabId}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.items}>
        {items.map((item) => (
          <div
            key={item.id}
            className={`${styles.item} ${tab === item.id ? styles.active : ""}`}
            onClick={() => handleTabChange(item.id)}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SideBox;
