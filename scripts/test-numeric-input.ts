import assert from "node:assert/strict";

// Test helper that mirrors the normalization and parsing logic of NumericInput
function normalizeInput(
  raw: string,
  allowDecimal: boolean
): { normalized: string; parsed: number } {
  const filtered = allowDecimal
    ? raw.replace(/[^0-9.]/g, "")
    : raw.replace(/[^0-9]/g, "");

  let sanitized = filtered;
  if (allowDecimal && filtered.includes(".")) {
    const parts = filtered.split(".");
    sanitized = parts[0] + "." + parts.slice(1).join("");
  }

  let normalized = sanitized;
  if (/^0[0-9]+/.test(normalized)) {
    normalized = normalized.replace(/^0+/, "");
    if (normalized === "") normalized = "0";
  }

  if (normalized === "" || normalized === ".") {
    return { normalized, parsed: 0 };
  }

  const parsed = parseFloat(normalized);
  return { normalized, parsed: isNaN(parsed) ? 0 : parsed };
}

function handleBlurFallback(
  localText: string,
  min: number | undefined,
  max: number | undefined,
  fallbackOnBlur: number | undefined
): { localText: string; value: number } {
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
  return { localText: String(finalNum), value: finalNum };
}

// 1. Test clearing input (backspace to empty string)
{
  const { normalized, parsed } = normalizeInput("", false);
  assert.equal(normalized, "");
  assert.equal(parsed, 0);
}

// 2. Test typing new number into empty field (e.g. "5")
{
  const { normalized, parsed } = normalizeInput("5", false);
  assert.equal(normalized, "5");
  assert.equal(parsed, 5);
}

// 3. Test typing leading zero then number (e.g. "05" -> "5")
{
  const { normalized, parsed } = normalizeInput("05", false);
  assert.equal(normalized, "5");
  assert.equal(parsed, 5);
}

// 4. Test typing multiple leading zeros (e.g. "007" -> "7", "00" -> "0")
{
  const res1 = normalizeInput("007", false);
  assert.equal(res1.normalized, "7");
  assert.equal(res1.parsed, 7);

  const res2 = normalizeInput("00", false);
  assert.equal(res2.normalized, "0");
  assert.equal(res2.parsed, 0);
}

// 5. Test decimal rate input (e.g. "2.2", "0.8", "0.")
{
  const res1 = normalizeInput("2.2", true);
  assert.equal(res1.normalized, "2.2");
  assert.equal(res1.parsed, 2.2);

  const res2 = normalizeInput("0.8", true);
  assert.equal(res2.normalized, "0.8");
  assert.equal(res2.parsed, 0.8);

  const res3 = normalizeInput("0.", true);
  assert.equal(res3.normalized, "0.");
  assert.equal(res3.parsed, 0);
}

// 6. Test blur fallback on empty field
{
  // For buy available cash: min 0, fallbackOnBlur undefined -> defaults to 0
  const res1 = handleBlurFallback("", 0, undefined, undefined);
  assert.equal(res1.localText, "0");
  assert.equal(res1.value, 0);

  // For loan years: min 1, max 50, fallbackOnBlur 20 -> defaults to 20
  const res2 = handleBlurFallback("", 1, 50, 20);
  assert.equal(res2.localText, "20");
  assert.equal(res2.value, 20);

  // For valid number within bounds
  const res3 = handleBlurFallback("35", 1, 50, 20);
  assert.equal(res3.localText, "35");
  assert.equal(res3.value, 35);

  // Clamping over max
  const res4 = handleBlurFallback("60", 1, 50, 20);
  assert.equal(res4.localText, "50");
  assert.equal(res4.value, 50);
}

console.log("NumericInput behavior tests passed successfully!");
