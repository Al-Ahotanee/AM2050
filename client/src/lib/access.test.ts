/* AM2050 — Field Ledger Modernism: validate the same role rules used by both navigation and direct route guards. */
import { describe, expect, it } from "vitest";
import { canAccessModule, modules } from "@/lib/access";

function moduleByKey(key: string) {
  const module = modules.find((item) => item.key === key);
  if (!module) throw new Error(`Missing module: ${key}`);
  return module;
}

describe("AM2050 module access", () => {
  it("excludes headmasters and teachers from field-registry modules", () => {
    expect(canAccessModule("headmaster", moduleByKey("households"))).toBe(false);
    expect(canAccessModule("headmaster", moduleByKey("children"))).toBe(false);
    expect(canAccessModule("teacher", moduleByKey("households"))).toBe(false);
    expect(canAccessModule("teacher", moduleByKey("children"))).toBe(false);
  });

  it("allows field officers into child and household registration", () => {
    expect(canAccessModule("mobilizer", moduleByKey("households"))).toBe(true);
    expect(canAccessModule("mobilizer", moduleByKey("children"))).toBe(true);
    expect(canAccessModule("almajiri_liaison", moduleByKey("children"))).toBe(true);
  });

  it("exposes only verified field workflows in production navigation", () => {
    expect(modules.map((module) => module.key)).toEqual(["dashboard", "households", "children"]);
    expect(canAccessModule("ward_supervisor", moduleByKey("dashboard"))).toBe(true);
  });
});
