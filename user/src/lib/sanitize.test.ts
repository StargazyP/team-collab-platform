import { describe, it, expect } from "vitest";
import { sanitizeHtml, extractMentionedUserIds } from "./sanitize";

describe("sanitizeHtml", () => {
  it("빈 문자열·null·undefined는 빈 문자열 반환", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(null as unknown as string)).toBe("");
    expect(sanitizeHtml(undefined as unknown as string)).toBe("");
  });

  it("허용된 태그는 유지", () => {
    expect(sanitizeHtml("<p>hello</p>")).toBe("<p>hello</p>");
    expect(sanitizeHtml("<b>bold</b>")).toBe("<b>bold</b>");
    expect(sanitizeHtml("<ul><li>a</li></ul>")).toBe("<ul><li>a</li></ul>");
  });

  it("허용되지 않은 태그는 내용만 남김", () => {
    // script는 jsdom/브라우저에서 내용이 비어 올 수 있음 → 제거되면 통과
    expect(sanitizeHtml("<script>alert(1)</script>")).not.toContain("<script>");
    expect(sanitizeHtml("<div>ok</div>")).toBe("ok");
  });

  it("data-mention이 숫자면 mention span 유지", () => {
    expect(sanitizeHtml('<span data-mention="123">@user</span>')).toBe(
      '<span data-mention="123" class="mention">@user</span>'
    );
  });

  it("data-mention이 숫자가 아니면 일반 span만", () => {
    const result = sanitizeHtml('<span data-mention="abc">x</span>');
    expect(result).not.toContain('data-mention="abc"');
    expect(result).toContain("x");
  });
});

describe("extractMentionedUserIds", () => {
  it("빈 입력은 빈 배열", () => {
    expect(extractMentionedUserIds("")).toEqual([]);
    expect(extractMentionedUserIds(null as unknown as string)).toEqual([]);
  });

  it("data-mention 숫자 ID 추출", () => {
    expect(
      extractMentionedUserIds('<span data-mention="1">a</span> and <span data-mention="2">b</span>')
    ).toEqual([1, 2]);
  });

  it("중복 ID는 한 번만", () => {
    expect(
      extractMentionedUserIds('<span data-mention="3">x</span><span data-mention="3">y</span>')
    ).toEqual([3]);
  });
});
