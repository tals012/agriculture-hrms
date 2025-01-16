"use client";
import { useEffect, useState } from "react";
import Top from "./top";
import SideMenu from "./sideMenu";
import General from "./tabs/general";
import SideDetails from "./sideDetails";
import getClientById from "@/app/(backend)/actions/clients/getClientById";
import Spinner from "@/components/spinner";
import Image from "next/image";
import styles from "@/styles/bigModals/client/index.module.scss";

const Client = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSideDetailsOpen, setIsSideDetailsOpen] = useState(true);

  const [personalData, setPersonalData] = useState({
    id: null,
    serialNumber: null,
    name: "",
    nameEnglish: "",
    email: "",
    phone: "",
    secondaryPhone: "",
    logo: "",
    openingDate: null,
    address: "",
    postalCode: "",
    licenseNumber: "",
    licenseExist: false,
    licenseFromDate: null,
    licenseToDate: null,
    businessGovId: "",
    fax: "",
    accountantPhone: "",
    status: "ACTIVE",
    note: "",
    cityId: "",
    createdAt: null,
    updatedAt: null,
  });

  useEffect(() => {
    if (isOpen === false) return;
    const fetchData = async () => {
      setLoading(true);
      setPersonalData({
        id: null,
        serialNumber: null,
        name: "",
        nameEnglish: "",
        email: "",
        phone: "",
        secondaryPhone: "",
        logo: "",
        openingDate: null,
        address: "",
        postalCode: "",
        licenseNumber: "",
        licenseExist: false,
        licenseFromDate: null,
        licenseToDate: null,
        businessGovId: "",
        fax: "",
        accountantPhone: "",
        status: "ACTIVE",
        note: "",
        cityId: "",
        createdAt: null,
        updatedAt: null,
      });
      try {
        const res = await getClientById({ payload: { clientId: isOpen } });
        const { data, status } = res;
        if (status === 200) {
          setData(data);
          setPersonalData(data);
        }
        if (status === 404) {
          onClose();
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

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
        <Top onClose={onClose} data={data} setData={setData} />

        <div className={styles.wrapper}>
          <SideMenu
            items={[
              {
                icon: "/assets/icons/user-1.svg",
                title: "פרטי לקוח",
                width: 24.83,
                height: 32.5,
              },
            ]}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          {activeTab === 0 ? (
            <General
              personalData={personalData}
              setPersonalData={setPersonalData}
              clientId={isOpen}
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

          <SideDetails
            data={data}
            setData={setData}
            isSideDetailsOpen={isSideDetailsOpen}
            setIsSideDetailsOpen={setIsSideDetailsOpen}
          />
        </div>
      </div>
    </div>
  );
};

export default Client;
