import { Config, Context, Effect, Layer } from "effect";

interface AppConfigShape {
  readonly apiBaseUrl: string;
  readonly otlpBaseUrl: string;
  readonly appVersion: string;
}

export class AppConfig extends Context.Service<AppConfig, AppConfigShape>()(
  "effect-form/infrastructure/AppConfig",
) {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const apiBaseUrl = yield* Config.string("VITE_API_BASE_URL");
      const otlpBaseUrl = yield* Config.string("VITE_OTLP_BASE_URL").pipe(
        Config.withDefault("/otlp"),
      );
      const appVersion = yield* Config.string("VITE_APP_VERSION").pipe(
        Config.withDefault("0.0.0"),
      );

      return AppConfig.of({
        apiBaseUrl,
        otlpBaseUrl,
        appVersion,
      });
    }),
  );
}
