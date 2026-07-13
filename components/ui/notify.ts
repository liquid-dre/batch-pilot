import { toast as sonner } from "sonner";

/**
 * The one toast entry point. Every component imports `notify` from here and
 * never calls `sonner` directly, so tone mapping, icons and styling can be
 * retuned in one place (the styling itself lives on `[data-sonner-toast]` in
 * globals.css + the <AppToaster/> config).
 *
 * Use the right tone for the context: `success` (record saved, allocation
 * confirmed), `error` (save/validation failure), `warning` (saved but with a
 * caveat — a short/over feed delivery, a below-target weigh-in), `info`
 * (neutral notices). For async work use `promise()` so the user sees one toast
 * go loading → success/error.
 */
export type ToastTone = "success" | "warning" | "error" | "info";

export interface NotifyOptions {
  description?: string;
}

/** A toast's content; `tone` lets a promise's success branch downgrade to warning. */
export interface ToastContent {
  title: string;
  description?: string;
  tone?: ToastTone;
}

export interface PromiseOptions<T> {
  loading: string;
  success: ToastContent | ((data: T) => ToastContent);
  error: ToastContent | ((err: unknown) => ToastContent);
  /** Show the loading toast only if the work is still pending after this many ms. */
  threshold?: number;
}

function emit(content: ToastContent, defaultTone: ToastTone, id?: string | number) {
  const opts = { description: content.description, id };
  switch (content.tone ?? defaultTone) {
    case "warning":
      return sonner.warning(content.title, opts);
    case "error":
      return sonner.error(content.title, opts);
    case "info":
      return sonner.info(content.title, opts);
    default:
      return sonner.success(content.title, opts);
  }
}

export const notify = {
  success: (title: string, o?: NotifyOptions) => sonner.success(title, { description: o?.description }),
  error: (title: string, o?: NotifyOptions) => sonner.error(title, { description: o?.description }),
  warning: (title: string, o?: NotifyOptions) => sonner.warning(title, { description: o?.description }),
  info: (title: string, o?: NotifyOptions) => sonner.info(title, { description: o?.description }),

  /**
   * One toast for an async action: loading → success/error. The loading state
   * only appears if the promise is still pending after `threshold` ms, so an
   * instant (mock) save resolves straight to success with no loading flash,
   * while a real network save shows loading and updates the same toast in place.
   * Returns the underlying promise (rejecting after the error toast) so callers
   * can still run their post-save state updates on the resolved value.
   */
  promise<T>(promise: Promise<T>, { loading, success, error, threshold = 150 }: PromiseOptions<T>): Promise<T> {
    let id: string | number | undefined;
    let shown = false;
    const timer = setTimeout(() => {
      id = sonner.loading(loading);
      shown = true;
    }, threshold);

    return promise.then(
      (data) => {
        clearTimeout(timer);
        emit(typeof success === "function" ? success(data) : success, "success", shown ? id : undefined);
        return data;
      },
      (err) => {
        clearTimeout(timer);
        emit(typeof error === "function" ? error(err) : error, "error", shown ? id : undefined);
        throw err;
      },
    );
  },
};
