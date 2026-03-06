import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PeriodSelector } from "../period-selector";

describe("PeriodSelector", () => {
  it("renders all period options", () => {
    const onChange = vi.fn();
    render(<PeriodSelector value="1Y" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: "3개월" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "6개월" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "1년" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "3년" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "전체" })).toBeInTheDocument();
  });

  it("shows selected period as pressed", () => {
    const onChange = vi.fn();
    render(<PeriodSelector value="6M" onChange={onChange} />);

    const sixMonthButton = screen.getByRole("radio", { name: "6개월" });
    expect(sixMonthButton).toHaveAttribute("data-state", "on");
  });

  it("calls onChange when clicking a different period", () => {
    const onChange = vi.fn();
    render(<PeriodSelector value="1Y" onChange={onChange} />);

    const maxButton = screen.getByRole("radio", { name: "전체" });
    fireEvent.click(maxButton);

    expect(onChange).toHaveBeenCalledWith("MAX");
  });

  it("does not call onChange when clicking same period", () => {
    const onChange = vi.fn();
    render(<PeriodSelector value="3M" onChange={onChange} />);

    const threeMonthButton = screen.getByRole("radio", { name: "3개월" });
    fireEvent.click(threeMonthButton);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("has correct aria-label on group", () => {
    const onChange = vi.fn();
    render(<PeriodSelector value="1Y" onChange={onChange} />);

    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "Select period"
    );
  });
});
