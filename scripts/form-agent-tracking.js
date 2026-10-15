/*
 * Round-2 tracking for the official AEM Forms EDS block (blocks/form, unmodified).
 * Runs only on the round-2 test page. Before the block registers its WebMCP tools, wraps the
 * browser's modelContext.registerTool so every tool call is reported to the /__webmcp beacon,
 * exactly like the round-1 block does. Tool names, descriptions and schemas are not changed.
 */
import {
  initTracking, trackingModelContext, nativeModelContext,
} from '../blocks/visit-form/tracking.js';

const PAGES = ['/montreal-visit-request-2'];

if (PAGES.includes(window.location.pathname.replace(/\/$/, ''))) {
  const host = nativeModelContext();
  if (host && typeof host.registerTool === 'function') {
    const tracked = trackingModelContext({
      registerTool: host.registerTool.bind(host),
      ...(typeof host.unregisterTool === 'function'
        ? { unregisterTool: host.unregisterTool.bind(host) } : {}),
    });
    try {
      Object.defineProperty(host, 'registerTool', {
        value: tracked.registerTool, configurable: true, writable: true,
      });
    } catch { /* non-configurable: tool calls will not be reported */ }
  }
  initTracking({
    submitPath: '/api/visit-request/submit',
    formId: 'montreal-visit-request-2',
    defaultSubmitVia: 'dom',
    reportFromFetch: true,
  });
}
