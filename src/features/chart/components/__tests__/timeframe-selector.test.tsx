import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimeframeSelector } from "../timeframe-selector";

describe("TimeframeSelector", () => {
  it("renders all timeframe options", () => {
    const onChange = vi.fn();
    render(<TimeframeSelector value="1D" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: "1m" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "5m" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "15m" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "1h" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "1D" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "1W" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "1M" })).toBeInTheDocument();
  });

  it("shows selected timeframe as pressed", () => {
    const onChange = vi.fn();
    render(<TimeframeSelector value="1h" onChange={onChange} />);

    const hourButton = screen.getByRole("radio", { name: "1h" });
    expect(hourButton).toHaveAttribute("data-state", "on");
  });

  it("calls onChange when clicking a different timeframe", () => {
    const onChange = vi.fn();
    render(<TimeframeSelector value="1D" onChange={onChange} />);

    const weekButton = screen.getByRole("radio", { name: "1W" });
    fireEvent.click(weekButton);

    expect(onChange).toHaveBeenCalledWith("1W");
  });

  it("does not call onChange when clicking same timeframe", () => {
    const onChange = vi.fn();
    render(<TimeframeSelector value="1D" onChange={onChange} />);

    const dayButton = screen.getByRole("radio", { name: "1D" });
    fireEvent.click(dayButton);

    // Already selected, should not trigger change (radix behavior: v becomes empty string)
    expect(onChange).not.toHaveBeenCalled();
  });

  it("has correct aria-label on group", () => {
    const onChange = vi.fn();
    render(<TimeframeSelector value="1D" onChange={onChange} />);

    // Radix ToggleGroup uses role="group" not "radiogroup"
    expect(screen.getByRole("group")).toHaveAttribute("aria-label", "Select timeframe");
  });
});
