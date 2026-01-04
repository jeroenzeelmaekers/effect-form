import { Atom } from '@effect-atom/atom-react';
import { ApiLive } from './api/client';

// const MainLive = Layer.mergeAll(ApiLive, TracingLive);

export const runtimeAtom = Atom.runtime(ApiLive);
