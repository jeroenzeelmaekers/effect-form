import { expect, it } from "vite-plus/test";
import { render } from "vitest-browser-react";

import { Route } from "./about";

const About = Route.options.component!;

it("renders the about heading and message", async () => {
  const screen = await render(<About />);

  await expect
    .element(screen.getByRole("heading", { level: 1, name: "About" }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByText("Hello from About!"))
    .toBeInTheDocument();
});

it("provides a main landmark for the page content", async () => {
  const screen = await render(<About />);
  const main = screen.getByRole("main");

  await expect
    .element(main.getByRole("heading", { name: "About" }))
    .toBeInTheDocument();
  expect(main.element().id).toBe("main");
});
