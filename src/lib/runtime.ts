import { Atom } from '@effect-atom/atom-react';
import { Layer } from 'effect';
import { ApiLive } from './api/client';
import { TracingLive } from './telemetry';

const MainLive = Layer.mergeAll(ApiLive, TracingLive);

export const runtimeAtom = Atom.runtime(MainLive);
