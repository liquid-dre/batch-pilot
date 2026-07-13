import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock sonner so we can assert exactly which toast the wrapper fires.
const { toastMock } = vi.hoisted(() => ({
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(() => "toast-id"),
  },
}));
vi.mock("sonner", () => ({ toast: toastMock }));

import { notify } from "@/components/ui/notify";

/**
 * The novel bit is the threshold: an instant (mock) save must NOT flash a
 * loading toast, while a slow (network) save shows loading and updates the SAME
 * toast to success/error. Fake timers let us prove both without a browser.
 */
beforeEach(() => {
  vi.useFakeTimers();
  Object.values(toastMock).forEach((fn) => fn.mockClear());
  toastMock.loading.mockReturnValue("toast-id");
});
afterEach(() => vi.useRealTimers());

describe("notify.promise threshold", () => {
  it("resolves before the threshold → success, no loading flash", async () => {
    const result = notify.promise(Promise.resolve("ok"), {
      loading: "Saving…",
      success: { title: "Saved" },
      error: { title: "Failed" },
    });
    await result;
    expect(toastMock.loading).not.toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith("Saved", { description: undefined, id: undefined });
  });

  it("still pending after the threshold → loading, then success on the same id", async () => {
    let resolveFn: (v: string) => void = () => {};
    const pending = new Promise<string>((res) => (resolveFn = res));
    const result = notify.promise(pending, {
      loading: "Saving…",
      success: (v) => ({ title: `Saved ${v}` }),
      error: { title: "Failed" },
      threshold: 150,
    });
    vi.advanceTimersByTime(150);
    expect(toastMock.loading).toHaveBeenCalledWith("Saving…");
    resolveFn("row");
    await result;
    expect(toastMock.success).toHaveBeenCalledWith("Saved row", { description: undefined, id: "toast-id" });
  });

  it("honours a success branch that downgrades to warning", async () => {
    await notify.promise(Promise.resolve(80), {
      loading: "Saving…",
      success: (pct) => ({ title: "Weights saved", tone: pct >= 98 ? "success" : "warning" }),
      error: { title: "Failed" },
    });
    expect(toastMock.warning).toHaveBeenCalledWith("Weights saved", { description: undefined, id: undefined });
    expect(toastMock.success).not.toHaveBeenCalled();
  });

  it("rejects → error toast, and the promise still rejects", async () => {
    const result = notify.promise(Promise.reject(new Error("boom")), {
      loading: "Saving…",
      success: { title: "Saved" },
      error: { title: "Couldn't save" },
    });
    await expect(result).rejects.toThrow("boom");
    expect(toastMock.loading).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith("Couldn't save", { description: undefined, id: undefined });
  });
});
