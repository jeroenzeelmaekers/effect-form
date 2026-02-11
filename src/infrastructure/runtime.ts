import { Atom } from '@effect-atom/atom-react';
import { Layer } from 'effect';

import { getDebugSettingsSync } from '@/domains/debug/service';
import { PostService } from '@/domains/post/service';
import { UserService } from '@/domains/user/service';
import { TelemetryLive } from '@/infrastructure/telemetry';
import { ApiLive } from '@/shared/api/client';

const ServicesLive = Layer.mergeAll(
  UserService.Default,
  PostService.Default,
).pipe(Layer.provide(ApiLive));

const MainLive = getDebugSettingsSync().otelEnabled
  ? ServicesLive.pipe(Layer.provideMerge(TelemetryLive))
  : ServicesLive;

export const runtimeAtom = Atom.runtime(MainLive);
