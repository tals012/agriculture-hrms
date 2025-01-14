"use client";

import { useEffect, useState, useCallback, useContext } from "react";
// import Client from "@/bigModals/client";
import ScreenFilter from "@/components/screenFilter";
import ScreenHead from "@/components/screenHead";
import Table from "@/containers/screens/clients/table";
// import CreateClient from "@/smallModals/client/createClient";
import { ToastContainer } from "react-toastify";
import getClients from "@/actions/clients/getClients";
import Spinner from "@/components/spinner";
import getClientsStats from "@/actions/clients/getClientsStats";
import { debounce } from "@/lib/debounce";
import ReactSelect from "react-select";
import TextField from "@/components/textField";
import Image from "next/image";
import getCities from "@/actions/misc/getCities";
import { useRouter } from "next/navigation";
import { getCookie } from "@/lib/getCookie";
import { MainAppContext } from "@/providers";
import styles from "@/styles/screens/clients.module.scss";

export default function Clients({ params }) {
  const router = useRouter();
  useEffect(() => {
    let token = getCookie("token");
    if (!token) {
      router.push("/login");
    }
  }, []);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createStatus, setCreateStatus] = useState(null);
  const [stats, setStats] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    sex: "",
    maritalStatus: "",
    clientStatus: "",
    city: "",
  });

  // * fetch clients
  const fetchData = async (searchQuery, filters) => {
    try {
      setLoading(true);
      let payload = { search: searchQuery, ...filters };
      const res = await getClients({ payload });
      const { data, status } = res;
      if (status === 200) {
        setClients(data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchData = useCallback(debounce(fetchData, 300), []);

  useEffect(() => {
    setCreateStatus(null);
    debouncedFetchData(search, filters);
  }, [search, createStatus, debouncedFetchData]);

  // * fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getClientsStats();
        const { data, status } = res;
        if (status === 200) {
          setStats({
            totalClientsCount: data.totalClientsCount,
            newClientsCount: data.newClientsCount,
            activeClientsCount: data.activeClientsCount,
            inactiveClientsCount: data.inactiveClientsCount,
          });
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchStats();
  }, [createStatus]);

  const handleSearch = () => {
    fetchData(search, filters);
    setFilterOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <ScreenHead
          title="לקוחות"
          count={stats?.totalClientsCount}
          desc="כאן תוכל לראות את כל הלקוחות שלך"
          stats={[
            {
              value: stats?.newClientsCount,
              text: "לקוחות חדשים",
            },
            {
              value: stats?.activeClientsCount,
              text: "עובדים פעילים",
            },
            {
              value: stats?.inactiveClientsCount,
              text: "משימות לביצוע",
            },
          ]}
        />
        <div className={styles.screenFilterWrapper}>
          <ScreenFilter
            isSearch={true}
            filter={true}
            filterClickHandler={() => setFilterOpen(true)}
            setIsCreateModalOpen={setIsCreateModalOpen}
            search={search}
            setSearch={setSearch}
            createText="הוספת לקוח"
          />
          {/* {filterOpen && (
            <FilterBox
              setIsOpen={setFilterOpen}
              filters={filters}
              setFilters={setFilters}
              handleSearch={handleSearch}
            />
          )} */}
        </div>
        {loading ? (
          <div className={styles.loader}>
            <Spinner size={30} />
          </div>
        ) : (
          <Table setModalOpen={setClientId} data={clients} />
        )}
      </div>

      {/* <Client isOpen={clientId} onClose={() => setClientId(false)} />
      {isCreateModalOpen && (
        <CreateClient
          setModalOpen={setIsCreateModalOpen}
          setCreateStatus={setCreateStatus}
          setClientId_={setClientId}
        />
      )} */}
      <ToastContainer />
    </div>
  );
}

// * filter box
// const FilterBox = ({ setIsOpen, filters, setFilters, handleSearch }) => {
//   const [cities, setCities] = useState(null);

//   // * fetch cities
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await getCities();
//         const { data, status } = res;
//         if (status === 200) {
//           setCities(data);
//         }
//       } catch (error) {
//         console.log(error);
//       }
//     };

//     fetchData();
//   }, []);

//   const selectStyle = {
//     control: (baseStyles, state) => ({
//       ...baseStyles,
//       width: "100%",
//       border: "1px solid #E6E6E6",
//       height: "44px",
//       fontSize: "14px",
//       color: "#999FA5",
//       borderRadius: "6px",
//       background: "transparent",
//       zIndex: 999999,
//     }),
//     menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
//     menu: (provided) => ({ ...provided, zIndex: 9999 }),
//   };

//   const handleFilterChange = (key, value) => {
//     setFilters((prevFilters) => ({
//       ...prevFilters,
//       [key]: value,
//     }));
//   };

//   const handleClearFilters = () => {
//     setFilters({
//       name: "",
//       sex: "",
//       maritalStatus: "",
//       clientStatus: "",
//       city: "",
//     });
//   };

//   return (
//     <div className={styles.filterBox}>
//       <div className={styles.header}>
//         <div className={styles.right}>
//           <h2>סינון</h2>
//           <p onClick={handleClearFilters}>נקה סינון</p>
//         </div>

//         <Image
//           src="/assets/icons/cross-2.svg"
//           alt="cross"
//           width={24}
//           height={24}
//           onClick={() => setIsOpen(false)}
//         />
//       </div>

//       <div className={styles.fields}>
//         <TextField
//           label="שם הלקוח"
//           width="100%"
//           value={filters.name}
//           onChange={(e) => handleFilterChange("name", e.target.value)}
//         />
//         <ReactSelect
//           options={[
//             {
//               value: "MALE",
//               label: "זכר",
//             },
//             {
//               value: "FEMALE",
//               label: "נקבה",
//             },
//           ]}
//           components={{
//             IndicatorSeparator: () => null,
//           }}
//           placeholder="מין"
//           name="sex"
//           value={
//             filters.sex
//               ? {
//                   value: filters.sex,
//                   label: (() => {
//                     const SexOptionsSelected = [
//                       {
//                         value: "MALE",
//                         label: "זכר",
//                       },
//                       {
//                         value: "FEMALE",
//                         label: "נקבה",
//                       },
//                     ].find(option => option.value === filters.sex)
//                     return SexOptionsSelected ? SexOptionsSelected.label : filters.sex;

//                   })(),
//                 }
//               : null
//           }
//           onChange={(option) =>
//             handleFilterChange("sex", option ? option.value : "")
//           }
//           menuPortalTarget={document.body}
//           menuPosition={"fixed"}
//           styles={selectStyle}
//         />
//         <ReactSelect
//           options={[
//             {
//               value: "SINGLE",
//               label: filters.sex === "MALE" ? "רווק" : "רווקה",
//             },
//             {
//               value: "MARRIED",
//               label: filters.sex === "MALE" ? "נשוי" : "נשואה",
//             },
//             {
//               value: "DIVORCED",
//               label: filters.sex === "MALE" ? "גרוש" : "גרושה",
//             },
//             {
//               value: "WIDOWED",
//               label: filters.sex === "MALE" ? "אלמן" : "אלמנה",
//             },
//           ]}
//           components={{
//             IndicatorSeparator: () => null,
//           }}
//           placeholder="מצב משפחתי"
//           name="maritalStatus"
//           value={
//             filters.maritalStatus
//               ? {
//                   value: filters.maritalStatus,
//                   label: (() => {
//                     const maritalStatusSelected = [
//                       {
//                         value: "SINGLE",
//                         label: filters.sex === "MALE" ? "רווק" : "רווקה",
//                       },
//                       {
//                         value: "MARRIED",
//                         label: filters.sex === "MALE" ? "נשוי" : "נשואה",
//                       },
//                       {
//                         value: "DIVORCED",
//                         label: filters.sex === "MALE" ? "גרוש" : "גרושה",
//                       },
//                       {
//                         value: "WIDOWED",
//                         label: filters.sex === "MALE" ? "אלמן" : "אלמנה",
//                       },
//                     ].find(option => option.value === filters.maritalStatus)
//                     return maritalStatusSelected ? maritalStatusSelected.label : filters.maritalStatus;
                    
//                   })(),
//                 }
//               : null
//           }
//           onChange={(option) =>
//             handleFilterChange("maritalStatus", option ? option.value : "")
//           }
//           menuPortalTarget={document.body}
//           menuPosition={"fixed"}
//           styles={selectStyle}
//         />
//         {cities && (
//           <ReactSelect
//             options={cities.map((i) => ({
//               value: i.nameInHebrew,
//               label: i.nameInHebrew,
//             }))}
//             components={{
//               IndicatorSeparator: () => null,
//             }}
//             name="city"
//             placeholder="עיר"
//             value={
//               filters.city
//                 ? {
//                     value: filters.city,
//                     label: cities.find((c) => c.nameInHebrew === filters.city)
//                       ?.nameInHebrew,
//                   }
//                 : null
//             }
//             onChange={(option) =>
//               handleFilterChange("city", option ? option.value : "")
//             }
//             menuPortalTarget={document.body}
//             menuPosition={"fixed"}
//             styles={selectStyle}
//           />
//         )}
//         <ReactSelect
//           options={[
//             {
//               value: "ACTIVE",
//               label: "פעיל",
//             },
//             {
//               value: "INACTIVE",
//               label: "לא פעיל",
//             },
//             {
//               value: "SPOUSE",
//               label: "בזוגיות",
//             },
//             {
//               value: "HUMANITARIAN_CONFERENCE",
//               label: "ועידה הומניטרית",
//             },
//             {
//               value: "POTENTIAL",
//               label: `פוטנציאל חו"ל`,
//             },
//             {
//               value: "POTENTIAL_OF_ISRAEL",
//               label: "פוטנציאלי",
//             },
//             {
//               value: "EVERYONE",
//               label: "כולם",
//             },
//           ]}
//           components={{
//             IndicatorSeparator: () => null,
//           }}
//           placeholder="סטטוס לקוח"
//           name="clientStatus"
//           value={
//             filters.clientStatus
//               ? {
//                   value: filters.clientStatus,
//                   label: (() => {
//                   const ClientStatusSelected = [
//                     {
//                       value: "ACTIVE",
//                       label: "פעיל",
//                     },
//                     {
//                       value: "INACTIVE",
//                       label: "לא פעיל",
//                     },
//                     {
//                       value: "SPOUSE",
//                       label: "בזוגיות",
//                     },
//                     {
//                       value: "HUMANITARIAN_CONFERENCE",
//                       label: "ועידה הומניטרית",
//                     },
//                     {
//                       value: "POTENTIAL",
//                       label: `פוטנציאל חו"ל`,
//                     },
//                     {
//                       value: "POTENTIAL_OF_ISRAEL",
//                       label: "פוטנציאלי",
//                     },
//                     {
//                       value: "EVERYONE",
//                       label: "כולם",
//                     },
//                   ].find(option => option.value === filters.clientStatus)
//                   return ClientStatusSelected ? ClientStatusSelected.label : filters.clientStatus;
//                   })(),
//                 }
//               : null
//           }
//           onChange={(option) =>
//             handleFilterChange("clientStatus", option ? option.value : "")
//           }
//           menuPortalTarget={document.body}
//           menuPosition={"fixed"}
//           styles={selectStyle}
//         />
//         <button onClick={handleSearch}>חיפוש</button>
//       </div>
//     </div>
//   );
// };
