import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vite-plus/test";
import { render } from "vitest-browser-react";

import { Route } from "./about";

async function renderAbout() {
  const rootRoute = createRootRoute();

  const router = createRouter({
    routeTree: rootRoute.addChildren([Route]),
    history: createMemoryHistory({ initialEntries: ["/about"] }),
  });

  await router.load();

  return render(<RouterProvider router={router} />);
}

describe("About page", () => {
  it("renders the page heading at /about", async () => {
    const screen = await renderAbout();

    await expect
      .element(
        screen.getByRole("heading", { name: "About", level: 1, exact: true }),
      )
      .toBeVisible();
  });

  it("renders the greeting inside the main content", async () => {
    const screen = await renderAbout();

    await expect
      .element(
        screen
          .getByRole("main")
          .getByText("Hello from About!", { exact: true }),
      )
      .toBeVisible();
  });

  it("provides the main-content anchor", async () => {
    const screen = await renderAbout();

    await expect
      .element(screen.getByRole("main"))
      .toHaveAttribute("id", "main");
  });
});
