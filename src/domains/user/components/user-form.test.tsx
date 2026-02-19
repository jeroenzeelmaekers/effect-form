import { AsyncResult } from "effect/unstable/reactivity";
import { Cause } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { NetworkError } from "@/shared/api/errors";

import EffectForm from "./user-form";

// Mocks
const mockUseAtomValue = vi.fn();
const mockUseAtomSet = vi.fn(() => vi.fn());

vi.mock("@effect/atom-react", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@effect/atom-react")>();
  return {
    ...actual,
    useAtomValue: (atom: unknown) => mockUseAtomValue(atom),
    useAtomSet: (_atom: unknown) => mockUseAtomSet(),
  };
});

describe("UserForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: form enabled (users loaded successfully)
    mockUseAtomValue.mockReturnValue(AsyncResult.success([]));
    mockUseAtomSet.mockReturnValue(vi.fn());
  });

  describe("Render form", () => {
    it("renders all form fields", async () => {
      const screen = await render(<EffectForm />);

      await expect
        .element(screen.getByTestId("user-form-name"))
        .toBeInTheDocument();
      await expect
        .element(screen.getByTestId("user-form-username"))
        .toBeInTheDocument();
      await expect
        .element(screen.getByTestId("user-form-email"))
        .toBeInTheDocument();
      await expect
        .element(screen.getByTestId("user-form-language"))
        .toBeInTheDocument();
    });

    it("renders submit button with correct text", async () => {
      const screen = await render(<EffectForm />);

      await expect
        .element(screen.getByTestId("user-form-submit"))
        .toHaveTextContent("Create User");
    });

    it("disables fieldset when users atom is initial", async () => {
      mockUseAtomValue.mockReturnValue(AsyncResult.initial());

      const screen = await render(<EffectForm />);

      expect(screen.getByTestId("user-form-fieldset").element()).toHaveProperty(
        "disabled",
        true,
      );
    });

    it("disables fieldset when users atom is waiting", async () => {
      mockUseAtomValue.mockReturnValue(AsyncResult.success([], { waiting: true }));

      const screen = await render(<EffectForm />);

      expect(screen.getByTestId("user-form-fieldset").element()).toHaveProperty(
        "disabled",
        true,
      );
    });

    it("disables fieldset when users atom is failure", async () => {
      mockUseAtomValue.mockReturnValue(
        AsyncResult.failure(Cause.fail(new NetworkError({ traceId: "t-1" }))),
      );

      const screen = await render(<EffectForm />);

      expect(screen.getByTestId("user-form-fieldset").element()).toHaveProperty(
        "disabled",
        true,
      );
    });

    it("enables fieldset when users atom is success", async () => {
      mockUseAtomValue.mockReturnValue(AsyncResult.success([]));

      const screen = await render(<EffectForm />);

      expect(screen.getByTestId("user-form-fieldset").element()).toHaveProperty(
        "disabled",
        false,
      );
    });
  });

  describe("Handle form submission", () => {
    it("calls createUser with form values on valid submit", async () => {
      const mockCreateUser = vi.fn();
      mockUseAtomSet.mockReturnValue(mockCreateUser);

      const screen = await render(<EffectForm />);

      await screen.getByTestId("user-form-name").fill("Alice");
      await screen.getByTestId("user-form-username").fill("alice");
      await screen.getByTestId("user-form-email").fill("alice@test.com");

      // Select language
      await screen.getByTestId("user-form-language").click();
      await screen.getByText("English").click();

      await screen.getByTestId("user-form-submit").click();

      expect(mockCreateUser).toHaveBeenCalledOnce();
      expect(mockCreateUser).toHaveBeenCalledWith({
        _tag: "UserForm",
        name: "Alice",
        username: "alice",
        email: "alice@test.com",
        language: "en",
      });
    });

    it("resets form after successful submit", async () => {
      mockUseAtomSet.mockReturnValue(vi.fn());

      const screen = await render(<EffectForm />);

      await screen.getByTestId("user-form-name").fill("Alice");
      await screen.getByTestId("user-form-username").fill("alice");
      await screen.getByTestId("user-form-email").fill("alice@test.com");

      await screen.getByTestId("user-form-language").click();
      await screen.getByText("English").click();

      await screen.getByTestId("user-form-submit").click();

      await expect
        .element(screen.getByTestId("user-form-name"))
        .toHaveValue("");
      await expect
        .element(screen.getByTestId("user-form-username"))
        .toHaveValue("");
      await expect
        .element(screen.getByTestId("user-form-email"))
        .toHaveValue("");
    });
  });

  describe("Handle validation errors", () => {
    it("shows error when name is empty on submit", async () => {
      const screen = await render(<EffectForm />);

      // Fill other fields but leave name empty
      await screen.getByTestId("user-form-username").fill("alice");
      await screen.getByTestId("user-form-email").fill("alice@test.com");
      await screen.getByTestId("user-form-language").click();
      await screen.getByText("English").click();

      await screen.getByTestId("user-form-submit").click();

      await expect
        .element(screen.getByTestId("user-form-name-error"))
        .toBeInTheDocument();
    });

    it("shows error when username is empty on submit", async () => {
      const screen = await render(<EffectForm />);

      await screen.getByTestId("user-form-name").fill("Alice");
      await screen.getByTestId("user-form-email").fill("alice@test.com");
      await screen.getByTestId("user-form-language").click();
      await screen.getByText("English").click();

      await screen.getByTestId("user-form-submit").click();

      await expect
        .element(screen.getByTestId("user-form-username-error"))
        .toBeInTheDocument();
    });

    it("shows error when email is invalid on submit", async () => {
      const screen = await render(<EffectForm />);

      await screen.getByTestId("user-form-name").fill("Alice");
      await screen.getByTestId("user-form-username").fill("alice");
      await screen.getByTestId("user-form-email").fill("not-an-email");
      await screen.getByTestId("user-form-language").click();
      await screen.getByText("English").click();

      await screen.getByTestId("user-form-submit").click();

      await expect
        .element(screen.getByTestId("user-form-email-error"))
        .toBeInTheDocument();
    });

    it("shows error when no language selected on submit", async () => {
      const screen = await render(<EffectForm />);

      await screen.getByTestId("user-form-name").fill("Alice");
      await screen.getByTestId("user-form-username").fill("alice");
      await screen.getByTestId("user-form-email").fill("alice@test.com");
      // Leave language unset

      await screen.getByTestId("user-form-submit").click();

      await expect
        .element(screen.getByTestId("user-form-language-error"))
        .toBeInTheDocument();
    });

    it("does not show errors before submit", async () => {
      const screen = await render(<EffectForm />);

      // Touch field but don't submit
      const nameInput = screen.getByTestId("user-form-name");
      nameInput.element().focus();
      nameInput.element().blur();

      expect(
        screen.container.querySelector('[data-testid="user-form-name-error"]'),
      ).toBeNull();
    });

    it("re-enables submit button after correcting invalid data", async () => {
      const screen = await render(<EffectForm />);

      // Submit with all fields empty to trigger validation errors
      await screen.getByTestId("user-form-submit").click();

      // Button should be disabled after failed validation
      await expect
        .element(screen.getByTestId("user-form-submit"))
        .toBeDisabled();

      // Correct the data
      await screen.getByTestId("user-form-name").fill("Alice");
      await screen.getByTestId("user-form-username").fill("alice");
      await screen.getByTestId("user-form-email").fill("alice@test.com");
      await screen.getByTestId("user-form-language").click();
      await screen.getByText("English").click();

      // Button should be re-enabled now
      await expect
        .element(screen.getByTestId("user-form-submit"))
        .toBeEnabled();
    });

    it("clears validation errors after correcting data", async () => {
      const screen = await render(<EffectForm />);

      // Submit with empty name
      await screen.getByTestId("user-form-username").fill("alice");
      await screen.getByTestId("user-form-email").fill("alice@test.com");
      await screen.getByTestId("user-form-language").click();
      await screen.getByText("English").click();
      await screen.getByTestId("user-form-submit").click();

      // Error should be visible
      await expect
        .element(screen.getByTestId("user-form-name-error"))
        .toBeInTheDocument();

      // Fix the name field
      await screen.getByTestId("user-form-name").fill("Alice");

      // Error should be cleared
      expect(
        screen.container.querySelector('[data-testid="user-form-name-error"]'),
      ).toBeNull();
    });

    it("does not call createUser when validation fails", async () => {
      const mockCreateUser = vi.fn();
      mockUseAtomSet.mockReturnValue(mockCreateUser);

      const screen = await render(<EffectForm />);

      // Submit with all fields empty
      await screen.getByTestId("user-form-submit").click();

      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });
});
