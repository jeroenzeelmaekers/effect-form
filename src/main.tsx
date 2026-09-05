import "./index.css";

import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { setNavigate } from "@/infrastructure/navigation";

import { router } from "./router";

setNavigate((to) =>
  router.navigate({ to } as Parameters<typeof router.navigate>[0]),
);

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
