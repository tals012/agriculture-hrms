"use client";
import { useEffect, useState } from "react";
import Top from "./top";
import SideMenu from "./sideMenu";
import General from "./tabs/general";
import SideDetails from "./sideDetails";
import getClientById from "@/app/(backend)/actions/clients/getClientById";
import Spinner from "@/components/spinner";
import Image from "next/image";
import CreateManager from "@/smallModals/client/createManager";
import CreateRegionManager from "@/smallModals/client/createRegionManager";
import CreateField from "@/smallModals/client/createField";
import Managers from "./tabs/managers";
import RegionManagers from "./tabs/regionManagers";
import Fields from "./tabs/fields";
import styles from "@/styles/bigModals/client/index.module.scss";
import Pricing from "./tabs/pricing";
import CreatePricing from "@/smallModals/client/createPricing";
import WorkerHistory from "./tabs/workerHistory";

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

  const [isCreateManagerModalOpen, setIsCreateManagerModalOpen] =
    useState(false);
  const [createManagerStatus, setCreateManagerStatus] = useState(null);
  const [isCreateRegionManagerModalOpen, setIsCreateRegionManagerModalOpen] =
    useState(false);
  const [createRegionManagerStatus, setCreateRegionManagerStatus] = useState(null);
  const [isCreateFieldModalOpen, setIsCreateFieldModalOpen] = useState(false);
  const [createFieldStatus, setCreateFieldStatus] = useState(null);
  const [isCreatePricingModalOpen, setIsCreatePricingModalOpen] =
    useState(false);
  const [createPricingStatus, setCreatePricingStatus] = useState(null);

  useEffect(() => {
    if (isOpen === false) return;

    // Validate that isOpen is a valid non-empty string
    if (!isOpen || typeof isOpen !== "string" || isOpen.trim() === "") {
      console.error("Invalid client ID provided:", isOpen);
      onClose();
      return;
    }

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
        const res = await getClientById({ clientId: isOpen });
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
              {
                icon: "/assets/icons/user-1.svg",
                title: "מנהלים",
                width: 24.83,
                height: 32.5,
              },
              {
                icon: "/assets/icons/user-1.svg",
                title: "מנהלי אזור",
                width: 24.83,
                height: 32.5,
              },
              {
                icon: "/assets/icons/apartments-1.svg",
                title: "שדות",
                width: 24.83,
                height: 32.5,
              },
              {
                icon: "/assets/icons/money-1.svg",
                title: "תמחור",
                width: 24.83,
                height: 32.5,
              },
              {
                icon: "/assets/icons/user-1.svg",
                title: "היסטוריית עובדים",
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
          ) : activeTab === 1 ? (
            <Managers
              setIsCreateManagerModalOpen={setIsCreateManagerModalOpen}
              createManagerStatus={createManagerStatus}
              setCreateManagerStatus={setCreateManagerStatus}
              clientId={isOpen}
            />
          ) : activeTab === 2 ? (
            <RegionManagers
              setIsCreateRegionManagerModalOpen={setIsCreateRegionManagerModalOpen}
              createRegionManagerStatus={createRegionManagerStatus}
              setCreateRegionManagerStatus={setCreateRegionManagerStatus}
              clientId={isOpen}
            />
          ) : activeTab === 3 ? (
            <Fields
              setIsCreateFieldModalOpen={setIsCreateFieldModalOpen}
              createFieldStatus={createFieldStatus}
              setCreateFieldStatus={setCreateFieldStatus}
              clientId={isOpen}
            />
          ) : activeTab === 4 ? (
            <Pricing
              setIsCreatePricingModalOpen={setIsCreatePricingModalOpen}
              createPricingStatus={createPricingStatus}
              setCreatePricingStatus={setCreatePricingStatus}
              clientId={isOpen}
            />
          ) : activeTab === 5 ? (
            <WorkerHistory clientId={isOpen} />
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

      {/*
       // * ================================
       // * MODALS =========================
       // * ================================
       */}
      {isCreateManagerModalOpen && isOpen && typeof isOpen === "string" && (
        <CreateManager
          setModalOpen={setIsCreateManagerModalOpen}
          setCreateStatus={setCreateManagerStatus}
          clientId={isOpen}
        />
      )}
      {isCreateRegionManagerModalOpen && isOpen && typeof isOpen === "string" && (
        <CreateRegionManager
          setModalOpen={setIsCreateRegionManagerModalOpen}
          setCreateStatus={setCreateRegionManagerStatus}
          clientId={isOpen}
        />
      )}
      {isCreateFieldModalOpen && isOpen && typeof isOpen === "string" && (
        <CreateField
          setModalOpen={setIsCreateFieldModalOpen}
          setCreateStatus={setCreateFieldStatus}
          clientId={isOpen}
        />
      )}
      {isCreatePricingModalOpen && isOpen && typeof isOpen === "string" && (
        <CreatePricing
          setModalOpen={setIsCreatePricingModalOpen}
          setCreateStatus={setCreatePricingStatus}
          clientId={isOpen}
        />
      )}
    </div>
  );
};

export default Client;
