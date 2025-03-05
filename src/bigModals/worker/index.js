"use client";

import { useEffect, useState } from "react";
import Top from "./top";
import SideMenu from "./sideMenu";
import General from "./tabs/general";
import Credentials from "./tabs/credentials";
import SideDetails from "./sideDetails";
import getWorkerById from "@/app/(backend)/actions/workers/getWorkerById";
import Spinner from "@/components/spinner";
import Image from "next/image";
// import HarvestEntries from "./tabs/harvestEntries";
import styles from "@/styles/bigModals/worker/index.module.scss";

const Worker = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSideDetailsOpen, setIsSideDetailsOpen] = useState(true);

  const [personalData, setPersonalData] = useState({
    id: null,
    serialNumber: null,
    name: "",
    surname: "",
    fatherName: "",
    motherName: "",
    nameSpouse: "",
    nameHe: "",
    surnameHe: "",
    primaryPhone: "",
    secondaryPhone: "",
    email: "",
    address: "",
    sex: null,
    birthday: null,
    maritalStatus: null,
    primaryLanguage: "",
    primaryLanguages: [],
    secondaryLanguage: "",
    secondaryLanguages: [],
    additionalLanguages: [],
    countryArea: "",
    religion: "",
    workerStatus: "ACTIVE",
    company: "",
    metapelCode: "",
    passport: "",
    passportValidity: null,
    visa: "",
    visaValidity: null,
    inscriptionDate: null,
    entryDate: null,
    favoritePlace: "",
    favoriteSex: "",
    partnerPlace: "",
    note: "",
    countryId: "",
    cityId: "",
    bankId: null,
    branchId: null,
    bankAccountNumber: "",
    street: "",
    houseNumber: "",
    apartment: "",
    postalCode: "",
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
        surname: "",
        fatherName: "",
        motherName: "",
        nameSpouse: "",
        nameHe: "",
        surnameHe: "",
        primaryPhone: "",
        secondaryPhone: "",
        email: "",
        address: "",
        sex: null,
        birthday: null,
        maritalStatus: null,
        primaryLanguage: "",
        primaryLanguages: [],
        secondaryLanguage: "",
        secondaryLanguages: [],
        additionalLanguages: [],
        countryArea: "",
        religion: "",
        workerStatus: "ACTIVE",
        company: "",
        metapelCode: "",
        passport: "",
        passportValidity: null,
        visa: "",
        visaValidity: null,
        inscriptionDate: null,
        entryDate: null,
        favoritePlace: "",
        favoriteSex: "",
        partnerPlace: "",
        note: "",
        countryId: "",
        cityId: "",
        bankId: null,
        branchId: null,
        bankAccountNumber: "",
        street: "",
        houseNumber: "",
        apartment: "",
        postalCode: "",
        createdAt: null,
        updatedAt: null,
      });
      try {
        const res = await getWorkerById({ payload: { workerId: isOpen } });
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
      <div className={`${styles.modalOverlay} ${isOpen === false ? styles.close : styles.open}`}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.loading}>
            <Spinner size={100} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.modalOverlay} ${isOpen === false ? styles.close : styles.open}`} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <Top onClose={onClose} data={data} setData={setData} />

        <div className={styles.wrapper}>
          <SideMenu
            items={[
              {
                icon: "/assets/icons/user-1.svg",
                title: "פרטי עובד",
                width: 24.83,
                height: 32.5,
              },
              {
                icon: "/assets/icons/user-1.svg",
                title: "הרשאות",
                width: 24,
                height: 24,
              },
            ]}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          {activeTab === 0 ? (
            <General
              personalData={personalData}
              setPersonalData={setPersonalData}
              workerId={isOpen}
            />
          ) : activeTab === 1 ? (
            <Credentials workerId={isOpen} workerData={data} />
          ) : null}

          <Image
            src="/assets/icons/menu-1.svg"
            alt="menu"
            width={20}
            height={20}
            className={`${styles.menuIcon} ${isSideDetailsOpen ? styles.menuIconOpen : styles.menuIconClose}`}
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

export default Worker;
