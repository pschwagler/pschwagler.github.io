import { renderHook } from "@testing-library/react";
import { useEscapeKey } from "./use-escape-key";

function pressEscape() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
}

describe("useEscapeKey", () => {
  it("calls callback on Escape when active", () => {
    const callback = vi.fn();
    renderHook(() => useEscapeKey(callback, true));

    pressEscape();

    expect(callback).toHaveBeenCalledOnce();
  });

  it("does not call callback on Escape when inactive", () => {
    const callback = vi.fn();
    renderHook(() => useEscapeKey(callback, false));

    pressEscape();

    expect(callback).not.toHaveBeenCalled();
  });

  it("ignores non-Escape keys", () => {
    const callback = vi.fn();
    renderHook(() => useEscapeKey(callback, true));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(callback).not.toHaveBeenCalled();
  });

  it("cleans up listener on unmount", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(callback, true));

    unmount();
    pressEscape();

    expect(callback).not.toHaveBeenCalled();
  });

  it("cleans up listener when deactivated", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ active }) => useEscapeKey(callback, active),
      { initialProps: { active: true } }
    );

    rerender({ active: false });
    pressEscape();

    expect(callback).not.toHaveBeenCalled();
  });
});
