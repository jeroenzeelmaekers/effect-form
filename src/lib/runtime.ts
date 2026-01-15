import { Atom } from '@effect-atom/atom-react';
import { Layer } from 'effect';
import { ApiLive } from './api/client';
import { PostService } from './api/post.service';
import { UserService } from './api/user.service';
import { TracingLive } from './telemetry';

const isOtelEnabled = import.meta.env.VITE_ENABLE_OTEL === 'true';

const ServicesLive = Layer.mergeAll(
  UserService.Default,
  PostService.Default,
).pipe(Layer.provide(ApiLive));

const MainLive = isOtelEnabled
  ? ServicesLive.pipe(Layer.provide(TracingLive))
  : ServicesLive;

export const runtimeAtom = Atom.runtime(MainLive);
