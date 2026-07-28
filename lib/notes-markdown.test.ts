import { test, expect } from "bun:test";
import { safeHref, renderInline } from "./notes-markdown";

test("safeHref allows http/https/mailto and blocks unsafe schemes", () => {
  expect(safeHref("https://shop.com/x")).toBe("https://shop.com/x");
  expect(safeHref("http://shop.com")).toBe("http://shop.com");
  expect(safeHref("mailto:a@b.com")).toBe("mailto:a@b.com");
  expect(safeHref("  https://trim.me  ")).toBe("https://trim.me");
  expect(safeHref("javascript:alert(1)")).toBeNull();
  expect(safeHref("data:text/html;base64,x")).toBeNull();
  expect(safeHref("vbscript:x")).toBeNull();
  expect(safeHref("/relative")).toBeNull();
  expect(safeHref("")).toBeNull();
});

test("renderInline linkifies safe URLs but never emits an unsafe href", () => {
  const safe = renderInline("see [store](https://shop.com/x) now");
  const anchor = safe.find((n: any) => n && n.props && n.props.href);
  expect((anchor as any)?.props.href).toBe("https://shop.com/x");

  const unsafe = renderInline("[x](javascript:alert(1))");
  const bad = unsafe.find((n: any) => n && n.props && n.props.href);
  expect(bad).toBeUndefined(); // malicious URL degrades to plain text, no href

  const bare = renderInline("visit https://x.com today");
  const bareAnchor = bare.find((n: any) => n && n.props && n.props.href);
  expect((bareAnchor as any)?.props.href).toBe("https://x.com");
});
