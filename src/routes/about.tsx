import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <main id="main" className="p-3">
      <h1 className="text-2xl leading-loose font-semibold">About</h1>
      <p className="text-sm">Hello from About!</p>
    </main>
  );
}
