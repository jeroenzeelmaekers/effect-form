import { describe, expect, it } from "vite-plus/test";
import { render } from "vitest-browser-react";

import { About } from "./about";

describe("About page", () => {
  it("introduces the app and its user-management features", async () => {
    const screen = await render(<About />);

    await expect
      .element(screen.getByRole("heading", { level: 1 }))
      .toHaveTextContent("About Effect Form");
    await expect
      .element(screen.getByRole("heading", { name: "What you can do" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText(/Browse and sort users/))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText(/allow-user-creation/))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText(/Anthropic API key/))
      .toBeInTheDocument();
  });

  it("describes the architecture and links to the app", async () => {
    const screen = await render(<About />);

    await expect
      .element(screen.getByRole("heading", { name: "How it works" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText(/shared Effect services/))
      .toBeInTheDocument();

    const appLink = screen.getByRole("link", { name: "Explore the app" });
    expect(appLink.element().getAttribute("href")).toBe("/");
  });
});
