import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./app/App.tsx";
import "./styles/index.css";

Sentry.init({
  dsn: "https://79494a23b96342ccf3c9c5a43d922e5d@o4511732486897664.ingest.us.sentry.io/4511732496728064",
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0, 
});

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<p>অ্যাপে কোনো সমস্যা হয়েছে। দয়া করে রিফ্রেশ করুন।</p>}>
    <App />
  </Sentry.ErrorBoundary>
);