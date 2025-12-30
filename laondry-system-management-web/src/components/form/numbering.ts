export function normalizeDecimal(input: string, dec = ".", thou = ","): string {
  if (!input) return "";
  let s = input.replace(/\s/g, "");
  if (thou) {
    const reg = new RegExp(`\\${thou}`, "g");
    s = s.replace(reg, "");
  }
  if (dec !== ".") s = s.replace(dec, ".");
  return s;
}

export function formatDecimal(num: number, precision = 2, dec = ".", thou = ","): string {
  if (num == null || Number.isNaN(num)) return "";
  const s = num.toFixed(precision);
  const [i, f] = s.split(".");
  const withThou = i.replace(/\B(?=(\d{3})+(?!\d))/g, thou);
  return f != null && precision > 0 ? `${withThou}${dec}${f}` : withThou;
}
