"use client";

import ScreenHead from "@/components/screenHead";
import SideBox from "@/containers/settings/sideBox";
import Species from "@/containers/settings/species";
import HarvestTypes from "@/containers/settings/harvestTypes";
import styles from "@/styles/screens/settings.module.scss";
import { useSearchParams } from "next/navigation";

export default function Settings() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "organization";

  const renderContent = () => {
    switch (tab) {
      case "organization":
        return <div>Organization Settings Content</div>;
      case "species":
        return <Species />;
      case "harvest-types":
        return <HarvestTypes />;
      default:
        return <div>Organization Settings Content</div>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead
          title="הגדרות"
          count={0}
          desc="כאן תוכל לראות את כל ההגדרות שלך"
          stats={[]}
        />

        <div className={styles.row}>
          <SideBox />
          <div className={styles.content}>{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
