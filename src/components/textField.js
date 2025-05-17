import { useCallback, useMemo, useState } from "react";
import styles from "@/styles/components/textField.module.scss";

const TextField = ({
  label,
  width,
  maxWidth,
  value,
  onChange,
  multiline,
  className,
  iconRight,
  disabled,
  style,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const InputComponent = useMemo(
    () => (multiline ? "textarea" : "input"),
    [multiline]
  );

  const handleInput = (event) => {
    if (multiline) {
      const target = event.target;
      target.style.height = "100px"; // Reset height for recalculation
      target.style.height = `${target.scrollHeight}px`; // Adjust height to content
    }
    onChange && onChange(event);
  };

  return (
    <div
      className={styles.textfield}
      style={{
        width,
        ...(maxWidth && { maxWidth }),
        fontFamily: "var(--font-family)",
      }}
    >
      <InputComponent
        type="text"
        id="input"
        className={`${focused || value ? styles.focused : ""} ${
          className || ""
        } ${!!iconRight ? "!pl-[30px]" : ""}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={handleInput}
        value={value}
        required
        disabled={disabled}
        style={{
          backgroundColor: disabled ? "#FFFBE6" : "inherit",
          fontFamily: "var(--font-family)",
          ...(style || {}),
        }}
        {...props}
      />
      <label
        htmlFor="input"
        className={`${focused || value ? styles.shrink : ""}`}
        style={{ fontFamily: "var(--font-family)" }}
      >
        {label}
      </label>
      {!!iconRight && (
        <div className="absolute top-0 h-full flex items-center w-[30px] justify-center left-0">
          {iconRight}
        </div>
      )}
    </div>
  );
};

export default TextField;
