import { Atom } from '@effect-atom/atom-react';
import { Layer } from 'effect';
import { ApiLive } from './api/client';
import { PostService } from './api/post.service';
import { UserService } from './api/user.service';
import { TracingLive } from './telemetry';

const MainLive = Layer.mergeAll(UserService.Default, PostService.Default).pipe(
  Layer.provide(ApiLive),
  Layer.provide(TracingLive),
);

export const runtimeAtom = Atom.runtime(MainLive);
