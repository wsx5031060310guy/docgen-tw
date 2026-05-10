// 國字大寫數字（壹貳參…），支援萬/億/兆位
export function numberToChinese(n: string | number | undefined | null): string {
  if (n === undefined || n === null || n === "") return "";
  const num = parseInt(String(n).replace(/[^\d]/g, ""), 10);
  if (isNaN(num)) return "";
  if (num === 0) return "零";

  const digits = ["零", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖"];
  const units = ["", "拾", "佰", "仟"];
  const groups = ["", "萬", "億", "兆"];

  let out = "";
  let g = 0;
  let rest = num;
  while (rest > 0) {
    const part = rest % 10000;
    let partStr = "";
    let unit = 0;
    let prevZero = false;
    let p = part;
    while (p > 0) {
      const d = p % 10;
      if (d === 0) {
        if (!prevZero && partStr) partStr = "零" + partStr;
        prevZero = true;
      } else {
        partStr = digits[d] + units[unit] + partStr;
        prevZero = false;
      }
      unit++;
      p = Math.floor(p / 10);
    }
    if (partStr) out = partStr + groups[g] + out;
    else if (out && !out.startsWith("零")) out = "零" + out;
    g++;
    rest = Math.floor(rest / 10000);
  }
  return out.replace(/零+$/, "");
}

export function todayMinguo(): string {
  const d = new Date();
  return `中華民國 ${d.getFullYear() - 1911} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}
