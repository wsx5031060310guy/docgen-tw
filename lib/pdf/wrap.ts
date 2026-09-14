// @react-pdf/textkit only finds line-break opportunities at ASCII spaces, so long Chinese text overflows.
// Splitting every character through hyphenationCallback adds unwanted hyphens at line ends.
// Measure the local TTF with fontkit and wrap clause text before rendering instead.

import path from "node:path";
// @ts-expect-error fontkit 2.0.4 does not publish TypeScript declarations.
import * as fontkit from "fontkit";

type FontName = "serif" | "sans";

const FONT_PATHS: Record<FontName, string> = {
  serif: path.join(process.cwd(), "lib/pdf/fonts/NotoSerifTC.ttf"),
  sans: path.join(process.cwd(), "lib/pdf/fonts/NotoSansTC.ttf"),
};

const fonts = {
  serif: fontkit.openSync(FONT_PATHS.serif),
  sans: fontkit.openSync(FONT_PATHS.sans),
};

const NO_START = "，。；：、）」』】〕》〉！？…,.;:)]}!?";
const NO_END = "（「『【〔《〈([{";

function isCjk(char: string): boolean {
  return /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef\u3000-\u303f]/.test(char);
}

function tokens(line: string): string[] {
  const result: string[] = [];
  let buffer = "";

  for (const char of line) {
    if (isCjk(char)) {
      if (buffer) {
        result.push(buffer);
        buffer = "";
      }
      result.push(char);
    } else if (char === " ") {
      if (buffer) {
        result.push(buffer);
        buffer = "";
      }
      result.push(char);
    } else {
      buffer += char;
    }
  }

  if (buffer) result.push(buffer);
  return result;
}

export function wrapLines(
  text: string,
  opts: { font: FontName; fontSize: number; maxWidth: number },
): string[] {
  const font = fonts[opts.font];
  const width = (value: string) =>
    (font.layout(value).advanceWidth / font.unitsPerEm) * opts.fontSize;
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    const paragraphTokens = tokens(paragraph.replace(/^ +/, ""));
    let current = "";
    let currentWidth = 0;

    for (const token of paragraphTokens) {
      const tokenWidth = width(token);

      if (current && currentWidth + tokenWidth > opts.maxWidth && token !== " ") {
        if (NO_START.includes(token)) {
          current += token;
          currentWidth += tokenWidth;
          continue;
        }

        let carry = "";
        while (current && NO_END.includes(current[current.length - 1])) {
          carry = current[current.length - 1] + carry;
          current = current.slice(0, -1);
        }

        lines.push(current.replace(/^ +/, ""));
        current = carry + token;
        currentWidth = width(current);
      } else {
        current += token;
        currentWidth += tokenWidth;
      }
    }

    lines.push(current.replace(/^ +/, ""));
  }

  return lines;
}
