import Image from "next/image";
import DatePicker from "react-datepicker";
import { he } from "date-fns/locale";
import styles from "@/styles/components/dateField.module.scss";

const DateField = ({ label, width, maxWidth, value, onChange, disabled }) => {
  return (
    <DatePicker
      selected={value}
      onChange={onChange}
      className={styles.datepicker}
      wrapperClassName={styles.wrapper}
      enableTabLoop={false}
      placeholderText={label}
      icon={
        <Image
          src="/assets/icons/calendar-1.svg"
          width={30}
          height={30}
          alt="Calendar icon"
        />
      }
      showIcon={true}
      calendarIconClassName="calendar-icon"
      locale={he}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? "#FFFBE6" : "inherit",
        width,
        ...(maxWidth && { maxWidth }),
      }}
      timeZone="Asia/Jerusalem"
      dateFormat="dd/MM/yyyy"
    />
  );
};

export default DateField;
