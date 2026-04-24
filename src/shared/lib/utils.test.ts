import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("should return a single class unchanged", () => {
    expect(cn("px-2")).toBe("px-2");
  });

  it("should merge multiple classes", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("should resolve conflicting Tailwind utilities (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("px-2 py-1", "p-4")).toBe("p-4");
  });

  it("should handle conditional classes (truthy)", () => {
    expect(cn("base", true && "active")).toBe("base active");
  });

  it("should omit falsy conditional classes", () => {
    expect(cn("base", false && "inactive")).toBe("base");
    expect(cn("base", undefined)).toBe("base");
    expect(cn("base", null)).toBe("base");
  });

  it("should handle object syntax", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe(
      "text-red-500",
    );
  });

  it("should return an empty string when no inputs are provided", () => {
    expect(cn()).toBe("");
  });
});
