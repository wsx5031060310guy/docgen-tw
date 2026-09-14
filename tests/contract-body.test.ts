import { describe, expect, it } from "vitest";
import { parseContractBody, type BodyBlock } from "@/lib/contract-body";

function joinBlocks(blocks: BodyBlock[]): string {
  return blocks
    .map((block) => {
      if (block.kind === "blank") return "";
      if (block.kind === "indent") return `　${block.text}`;
      return block.text;
    })
    .join("\n");
}

describe("parseContractBody", () => {
  it("辨識 heading、item、indent、blank 與 para", () => {
    expect(parseContractBody("一、服務內容\n1. 提供顧問服務\n　續行說明\n\n立契約書人如下")).toEqual([
      { kind: "heading", text: "一、服務內容" },
      { kind: "item", text: "1. 提供顧問服務" },
      { kind: "indent", text: "續行說明" },
      { kind: "blank" },
      { kind: "para", text: "立契約書人如下" },
    ]);
  });

  it("合併連續空行", () => {
    expect(parseContractBody("甲\n\n\n乙")).toEqual([
      { kind: "para", text: "甲" },
      { kind: "blank" },
      { kind: "para", text: "乙" },
    ]);
  });

  it("分塊後往返不遺失文字", () => {
    const body = "一、服務內容\n1. 提供顧問服務\n　　保留第二個全形空白\n\n立契約書人如下";
    expect(joinBlocks(parseContractBody(body))).toBe(body);
  });
});
