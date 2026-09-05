type Navigate = (to: string) => Promise<void> | void;

let navigateImpl: Navigate | undefined;

export function setNavigate(impl: Navigate) {
  navigateImpl = impl;
}

export function navigate(to: string): Promise<void> {
  if (!navigateImpl) {
    throw new Error("Navigation has not been initialized");
  }

  return Promise.resolve(navigateImpl(to)).then(() => undefined);
}
