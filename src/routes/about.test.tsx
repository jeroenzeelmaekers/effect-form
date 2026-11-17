import { describe, expect, it } from "vite-plus/test";
import { render } from "vitest-browser-react";

import { Route } from "./about";

function renderAbout() {
  const About = Route.options.component;

  if (!About) {
    throw new Error("The about route must define a component");
  }

  return render(<About />);
}

describe("About page", () => {
  it("renders the About heading", async () => {
    const screen = await renderAbout();

    await expect
      .element(
        screen.getByRole("heading", { name: "About", level: 1, exact: true }),
      )
      .toBeVisible();
  });

  it("renders the greeting", async () => {
    const screen = await renderAbout();

    await expect
      .element(screen.getByText("Hello from About!", { exact: true }))
      .toBeVisible();
  });

  it("provides a main landmark targeted by the skip-to-content link", async () => {
    const screen = await renderAbout();

    await expect.element(screen.getByRole("main")).toHaveAttribute("id", "main");
  });
});
