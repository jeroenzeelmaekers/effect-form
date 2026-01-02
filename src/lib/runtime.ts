import { Atom } from '@effect-atom/atom-react';
import { ApiLive } from './api/client';

export const runtimeAtom = Atom.runtime(ApiLive);
