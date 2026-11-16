import { describe, expect, it } from "vite-plus/test";
import { render } from "vitest-browser-react";

import { Route } from "./about";

const About = Route.options.component!;

describe("About", () => {
  it("renders the page heading", async () => {
    const screen = await render(<About />);

    await expect
      .element(screen.getByRole("heading", { name: "About", level: 1 }))
      .toBeVisible();
  });

  it("renders the greeting", async () => {
    const screen = await render(<About />);

    await expect.element(screen.getByText("Hello from About!")).toBeVisible();
  });

  it("provides the main landmark as a skip-link target", async () => {
    const screen = await render(<About />);
    const main = screen.getByRole("main");

    await expect.element(main).toHaveAttribute("id", "main");
    await expect
      .element(main.getByRole("heading", { name: "About", level: 1 }))
      .toBeVisible();
    await expect.element(main.getByText("Hello from About!")).toBeVisible();
  });
});
