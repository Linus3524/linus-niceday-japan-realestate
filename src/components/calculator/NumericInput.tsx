import React, { useState, useEffect } from "react";

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "min" | "max" | "step"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  allowDecimal?: boolean;
  fallbackOnBlur?: number;
  className?: string;
  placeholder?: string;
}

export function NumericInput({
  value,
  onChange,
  min,
  max,
  step,
  allowDecimal = false,
  fallbackOnBlur,
  className = "",
  placeholder,
  onFocus,
  onBlur,
  onKeyDown,
  ...restProps
}: NumericInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localText, setLocalText] = useState(() => (value === 0 && placeholder ? "" : String(value)));

  // Sync from props when parent updates and user is not actively typing
  useEffect(() => {
    if (!isFocused) {
      setLocalText(String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Filter disallowed characters
    const filtered = allowDecimal
      ? raw.replace(/[^0-9.]/g, "")
      : raw.replace(/[^0-9]/g, "");

    // Allow only a single decimal point
    let sanitized = filtered;
    if (allowDecimal && filtered.includes(".")) {
      const parts = filtered.split(".");
      sanitized = parts[0] + "." + parts.slice(1).join("");
    }

    // Strip leading zeroes if followed by other digits (e.g., "05" -> "5", "00" -> "0", keeping "0." / "0")
    let normalized = sanitized;
    if (/^0[0-9]+/.test(normalized)) {
      normalized = normalized.replace(/^0+/, "");
      if (normalized === "") normalized = "0";
    }

    setLocalText(normalized);

    if (normalized === "" || normalized === ".") {
      onChange(0);
      return;
    }

    const parsed = parseFloat(normalized);
    if (!isNaN(parsed)) {
      let finalNum = parsed;
      if (max !== undefined && finalNum > max) {
        finalNum = max;
      }
      onChange(finalNum);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);

    let finalNum: number;
    if (localText === "" || localText === ".") {
      finalNum = fallbackOnBlur ?? (min !== undefined ? min : 0);
    } else {
      const parsed = parseFloat(localText);
      if (isNaN(parsed)) {
        finalNum = fallbackOnBlur ?? (min !== undefined ? min : 0);
      } else {
        finalNum = parsed;
        if (min !== undefined && finalNum < min) finalNum = min;
        if (max !== undefined && finalNum > max) finalNum = max;
      }
    }

    setLocalText(String(finalNum));
    onChange(finalNum);
    onBlur?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const currentVal = parseFloat(localText) || 0;
      const stepVal = step ?? 1;
      const delta = e.key === "ArrowUp" ? stepVal : -stepVal;
      let nextVal = currentVal + delta;
      if (allowDecimal) {
        nextVal = Math.round(nextVal * 100) / 100;
      }
      if (min !== undefined && nextVal < min) nextVal = min;
      if (max !== undefined && nextVal > max) nextVal = max;

      setLocalText(String(nextVal));
      onChange(nextVal);
    }
    onKeyDown?.(e);
  };

  return (
    <input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={localText}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
      {...restProps}
    />
  );
}
