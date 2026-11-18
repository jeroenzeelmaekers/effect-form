import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { navigate, setNavigate } from "./navigation";

afterEach(() => {
  setNavigate(() => undefined);
});

describe("navigation bridge", () => {
  it("throws when navigation has not been initialized", async () => {
    vi.resetModules();
    const freshNavigation = await import("./navigation");

    expect(() => freshNavigation.navigate("/users")).toThrow(
      "Navigation has not been initialized",
    );
  });

  it("propagates synchronous navigation failures", () => {
    const failure = new Error("router failure");
    setNavigate(() => {
      throw failure;
    });

    expect(() => navigate("/users")).toThrow(failure);
  });

  it(
    "forwards the destination and resolves after synchronous navigation",
    async () => {
      const handler = vi.fn();
      setNavigate(handler);

      await expect(navigate("/users")).resolves.toBeUndefined();
      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith("/users");
    },
  );

  it("waits for asynchronous navigation to finish", async () => {
    let complete!: () => void;
    const handler = vi.fn(
      () => new Promise<void>((resolve) => (complete = resolve)),
    );
    setNavigate(handler);

    const result = navigate("/posts");
    expect(handler).toHaveBeenCalledWith("/posts");

    complete();
    await expect(result).resolves.toBeUndefined();
  });
});
