import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Não captura erros em desenvolvimento local
  enabled: process.env.NODE_ENV === "production",
  // 10% das sessões — ajustar para cima quando tiver mais usuários
  tracesSampleRate: 0.1,
  // Replay apenas quando há erro (não grava sessões normais por privacidade/custo)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
