import Image from "next/image";
import styles from "@/styles/components/screenFilter.module.scss";

const ScreenFilter = ({
  isSearch,
  search,
  setSearch,
  download,
  filter,
  filterClickHandler = () => {},
  setIsCreateModalOpen,
  createText,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.right}>
        {filter && (
          <div className={styles.block} onClick={filterClickHandler}>
            <Image
              src="/assets/icons/filter-1.svg"
              alt="filter-icon"
              width={16}
              height={16}
            />
            <p>סינון</p>
          </div>
        )}

        {isSearch || (filter && <span className={styles.divider}></span>)}

        {isSearch && (
          <div className={`${styles.block} ${styles.search}`}>
            <Image
              src="/assets/icons/search-2.svg"
              alt="search-icon"
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
        )}
      </div>

      <div className={styles.left}>
        <button onClick={() => setIsCreateModalOpen(true)}>
          + {createText}
        </button>
      </div>
    </div>
  );
};

export default ScreenFilter;
