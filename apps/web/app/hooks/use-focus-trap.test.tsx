import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFocusTrap } from "./use-focus-trap";

function TrapHarness({ active }: { active: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(active);
  return (
    <div ref={ref}>
      <button>First</button>
      <button>Second</button>
      <button>Third</button>
    </div>
  );
}

describe("useFocusTrap", () => {
  it("wraps focus from last to first on Tab", async () => {
    const user = userEvent.setup();
    render(<TrapHarness active={true} />);

    screen.getByText("Third").focus();
    await user.tab();

    expect(screen.getByText("First")).toHaveFocus();
  });

  it("wraps focus from first to last on Shift+Tab", async () => {
    const user = userEvent.setup();
    render(<TrapHarness active={true} />);

    screen.getByText("First").focus();
    await user.tab({ shift: true });

    expect(screen.getByText("Third")).toHaveFocus();
  });

  it("does not trap focus when inactive", async () => {
    const user = userEvent.setup();
    render(<TrapHarness active={false} />);

    screen.getByText("Third").focus();
    await user.tab();

    // Focus leaves the container (not trapped)
    expect(screen.getByText("First")).not.toHaveFocus();
  });
});
