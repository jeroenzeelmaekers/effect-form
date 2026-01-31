import { Atom } from '@effect-atom/atom-react';
import { Layer } from 'effect';
import { PostService } from '@/domains/post/service';
import { UserService } from '@/domains/user/service';
import { ApiLive } from '@/shared/api/client';
import { TelemetryLive } from '@/infrastructure/telemetry';

const isOtelEnabled = import.meta.env.VITE_ENABLE_OTEL === 'true';

const ServicesLive = Layer.mergeAll(
  UserService.Default,
  PostService.Default,
).pipe(Layer.provide(ApiLive));

const MainLive = isOtelEnabled
  ? ServicesLive.pipe(Layer.provideMerge(TelemetryLive))
  : ServicesLive;

export const runtimeAtom = Atom.runtime(MainLive);
