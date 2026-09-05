type Navigate = (to: string) => Promise<void> | void;

let navigateImpl: Navigate | undefined;

export function setNavigate(impl: Navigate) {
  navigateImpl = impl;
}

export async function navigate(to: string) {
  if (!navigateImpl) {
    throw new Error("Navigation has not been initialized");
  }

  await navigateImpl(to);
}
