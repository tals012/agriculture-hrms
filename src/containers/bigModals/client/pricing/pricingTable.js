"use client";
import Image from "next/image";
import { Plus } from "@/svgs/plus";
import { useCallback, useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import { toast } from "react-toastify";
import { Trash } from "@/svgs/trash";
import { debounce } from "@/lib/debounce";
import getPricing from "@/app/(backend)/actions/clients/getPricing";
import deletePricing from "@/app/(backend)/actions/clients/deletePricing";
import styles from "@/styles/containers/bigModals/client/managers/managersTable.module.scss";

const PricingTable = ({
  setIsCreatePricingModalOpen,
  createPricingStatus,
  setCreatePricingStatus,
  clientId,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async (searchQuery) => {
    try {
      setLoading(true);
      const filters = {
        clientId,
        ...(searchQuery && { search: searchQuery })
      };
      
      const res = await getPricing(filters);
      if (res?.status === 200) {
        setData(res.data);
      } else {
        console.error("Error fetching pricing combinations:", res?.message);
        setData([]);
      }
    } catch (error) {
      console.error("Error fetching pricing combinations:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchData = useCallback(debounce(fetchData, 300), [clientId]);

  useEffect(() => {
    setCreatePricingStatus(null);
    debouncedFetchData(search);
  }, [search, createPricingStatus, debouncedFetchData, clientId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.search}>
          <div className={styles.searchInput}>
            <Image
              src="/assets/icons/search-2.svg"
              alt="search"
              width={16}
              height={16}
            />
            <input
              type="text"
              placeholder="חיפוש"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.button}>
            <Plus color="#ffffff" />
            הוספת תמחור
          </button>
        </div>
        <div className={styles.loading}>
          <Spinner />
        </div>
      </div>
    );
  }

  const handleDelete = async (id) => {
    try {
      const res = await deletePricing({
        id,
        clientId
      });

      if (res?.status === 200) {
        toast.success(res.message, {
          position: "top-center",
        });
        debouncedFetchData(search);
      } else {
        toast.error(res?.message || "Failed to delete pricing combination", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error deleting pricing combination:", error);
      toast.error("Failed to delete pricing combination", {
        position: "top-center",
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.search}>
        <div className={styles.searchInput}>
          <Image
            src="/assets/icons/search-2.svg"
            alt="search"
            width={16}
            height={16}
          />
          <input
            type="text"
            placeholder="חיפוש"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={styles.button}
          onClick={() => setIsCreatePricingModalOpen(true)}
        >
          <Plus color="#ffffff" />
          הוספת תמחור
        </button>
      </div>
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Species</th>
              <th>Harvest Type</th>
              <th>Price</th>
              <th>Container Norm</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  <p>לא נמצאו שילובי תמחורים</p>
                </td>
              </tr>
            )}
            {data.map((pricing) => (
              <tr key={pricing.id}>
                <td>
                  <p>{pricing.name}</p>
                </td>
                <td>
                  <p>{pricing.species.name}</p>
                </td>
                <td>
                  <p>{pricing.harvestType.name}</p>
                </td>
                <td>
                  <p>{pricing.price}</p>
                </td>
                <td>
                  <p>{pricing.containerNorm}</p>
                </td>
                <td>
                  <div className={styles.icons}>
                    <div
                      onClick={() => handleDelete(pricing.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <Trash color="red" />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PricingTable; 