export type BodyBlock =
  | { kind: "heading"; text: string }
  | { kind: "item"; text: string }
  | { kind: "indent"; text: string }
  | { kind: "blank" }
  | { kind: "para"; text: string };

export function parseContractBody(body: string): BodyBlock[] {
  const blocks: BodyBlock[] = [];

  for (const line of body.split(/\r?\n/)) {
    if (line === "") {
      if (blocks.at(-1)?.kind !== "blank") blocks.push({ kind: "blank" });
    } else if (/^[一二三四五六七八九十]+、/.test(line)) {
      blocks.push({ kind: "heading", text: line });
    } else if (/^\d+\.\s/.test(line)) {
      blocks.push({ kind: "item", text: line });
    } else if (line.startsWith("　")) {
      blocks.push({ kind: "indent", text: line.slice(1) });
    } else {
      blocks.push({ kind: "para", text: line });
    }
  }

  return blocks;
}
