"use client";
import { useEffect, useState, useCallback } from "react";
import Top from "./top";
import SideMenu from "./sideMenu";
import Spinner from "@/components/spinner";
import Image from "next/image";
import getGroupMembers from "@/app/(backend)/actions/groups/getGroupMembers";
import { toast } from "react-toastify";
import styles from "@/styles/bigModals/group/index.module.scss";
import Members from "./tabs/members";

const Group = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSideDetailsOpen, setIsSideDetailsOpen] = useState(true);

  const fetchGroupData = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const res = await getGroupMembers({ groupId: isOpen });
      if (res?.status === 200) {
        setMembers(res.data || []);
      } else if (res?.status === 404) {
        toast.error("Group not found", {
          position: "top-center",
          autoClose: 3000,
        });
        onClose();
      } else {
        toast.error(res?.message || "Failed to fetch group members", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Error fetching group members:", error);
      toast.error("Failed to fetch group members", {
        position: "top-center",
        autoClose: 3000,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handleDataUpdate = useCallback(async () => {
    await fetchGroupData();
  }, [fetchGroupData]);

  if (loading) {
    return (
      <div
        className={styles.modalOverlay}
        onClick={onClose}
        style={{
          right: isOpen === false ? "-1520px" : "0px",
          left: isOpen === false ? "unset" : "0",
        }}
      >
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.loading}>
            <Spinner size={100} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        ${styles.modalOverlay} 
        ${isOpen === false ? styles.close : styles.open}
      `}
      onClick={onClose}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <Top onClose={onClose} />

        <div className={styles.wrapper}>
          <SideMenu
            items={[
              {
                icon: "/assets/icons/user-1.svg",
                title: "general",
                width: 24.83,
                height: 32.5,
              },
            ]}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          {activeTab === 0 ? (
            <Members 
              groupId={isOpen} 
              members={members} 
              onUpdate={handleDataUpdate}
            />
          ) : null}

          <Image
            src="/assets/icons/menu-1.svg"
            alt="menu"
            width={20}
            height={20}
            className={`${styles.menuIcon} ${
              isSideDetailsOpen ? styles.menuIconOpen : styles.menuIconClose
            }`}
            onClick={() => setIsSideDetailsOpen(!isSideDetailsOpen)}
          />
        </div>
      </div>
    </div>
  );
};

export default Group;
