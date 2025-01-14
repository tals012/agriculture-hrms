import styles from "@/styles/components/screenHead.module.scss";

const ScreenHead = ({ title, count, desc, stats }) => {
  let countValue = count ? String(count) : null;
  return (
    <div className={styles.container}>
      <div className={styles.right}>
        <h1>
          {title}
          {countValue && <span>{countValue}</span>}
        </h1>
        <p>{desc}</p>
      </div>

      {stats && (
        <div className={styles.left}>
          {stats.map((i, idx) => (
            <div className={styles.stat} key={idx}>
              <h3>{i.value}</h3>
              <p>{i.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScreenHead;
