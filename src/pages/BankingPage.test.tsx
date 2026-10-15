import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { expect, test } from "vitest";
import { BankingPage } from "./BankingPage";
import { App } from "../App";
test("banking page has no detectable accessibility violations", async () => {
  const { container } = render(<App />);
  expect(await axe(container)).toHaveNoViolations();
});
test("balances can be hidden and restored", () => {
  render(<BankingPage />);
  expect(screen.getByText("$44,300.75")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Hide balances" }));
  expect(screen.queryByText("$44,300.75")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Show balances" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Show balances" }));
  expect(screen.getByText("$44,300.75")).toBeVisible();
});
