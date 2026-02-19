import { AsyncResult } from "effect/unstable/reactivity";
import { Cause } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { User, UserId } from "@/domains/user/model";
import {
  NetworkError,
  NotFoundError,
  ValidationError,
} from "@/shared/api/errors";

import UserList from "./user-list";

// Mocks
const mockUseAtomValue = vi.fn();
const mockUseAtomRefresh = vi.fn(() => vi.fn());

vi.mock("@effect/atom-react", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@effect/atom-react")>();
  return {
    ...actual,
    useAtomValue: (atom: unknown) => mockUseAtomValue(atom),
    useAtomRefresh: (_atom: unknown) => mockUseAtomRefresh(),
  };
});

// Test data
const alice = new User({
  id: 1 as UserId,
  name: "Alice",
  username: "alice",
  email: "alice@test.com",
});

const bob = new User({
  id: 2 as UserId,
  name: "Bob",
  username: "bob",
  email: "bob@test.com",
});

const optimisticUser = new User({
  id: -1 as UserId,
  name: "Charlie",
  username: "charlie",
  email: "charlie@test.com",
});

describe("UserList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Handle loading state", () => {
    it("shows skeleton on initial load", async () => {
      mockUseAtomValue.mockReturnValue(AsyncResult.initial(true));

      const screen = await render(<UserList />);

      await expect
        .element(screen.getByTestId("user-list-loading"))
        .toBeInTheDocument();
    });

    it("shows data table during revalidation", async () => {
      mockUseAtomValue.mockReturnValue(
        AsyncResult.success([alice], { waiting: true }),
      );

      const screen = await render(<UserList />);

      await expect
        .element(screen.getByTestId("user-row-1"))
        .toBeInTheDocument();
    });
  });

  describe("Render users table", () => {
    it("renders user rows", async () => {
      mockUseAtomValue.mockReturnValue(AsyncResult.success([alice, bob]));

      const screen = await render(<UserList />);

      await expect
        .element(screen.getByTestId("user-row-1"))
        .toBeInTheDocument();
      await expect
        .element(screen.getByTestId("user-row-2"))
        .toBeInTheDocument();
    });

    it("shows empty state when no users", async () => {
      mockUseAtomValue.mockReturnValue(AsyncResult.success([]));

      const screen = await render(<UserList />);

      await expect.element(screen.getByTestId("empty-row")).toBeInTheDocument();
    });

    it("styles optimistic rows with muted text", async () => {
      mockUseAtomValue.mockReturnValue(AsyncResult.success([alice, optimisticUser]));

      const screen = await render(<UserList />);

      // The optimistic row (id < 0) should have muted styling
      const optimisticRow = screen.getByTestId("user-row--1");
      await expect.element(optimisticRow).toBeInTheDocument();
      expect(optimisticRow.element().className).toContain(
        "text-muted-foreground",
      );

      // Normal row should not have muted styling
      const aliceRow = screen.getByTestId("user-row-1");
      expect(aliceRow.element().className).not.toContain(
        "text-muted-foreground",
      );
    });
  });

  describe("Sorting", () => {
    it("sorts ascending on first click", async () => {
      mockUseAtomValue.mockReturnValue(AsyncResult.success([bob, alice]));

      const screen = await render(<UserList />);

      await screen.getByTestId("sort-name").click();

      const rows = screen.container.querySelectorAll("tbody tr");
      expect(rows[0]?.textContent).toContain("Alice");
      expect(rows[1]?.textContent).toContain("Bob");
    });

    it("sorts descending on second click", async () => {
      mockUseAtomValue.mockReturnValue(AsyncResult.success([alice, bob]));

      const screen = await render(<UserList />);

      const nameHeader = screen.getByTestId("sort-name");

      await nameHeader.click();
      await nameHeader.click();

      const rows = screen.container.querySelectorAll("tbody tr");
      expect(rows[0]?.textContent).toContain("Bob");
      expect(rows[1]?.textContent).toContain("Alice");
    });

    it("clears sort on third click", async () => {
      mockUseAtomValue.mockReturnValue(AsyncResult.success([bob, alice]));

      const screen = await render(<UserList />);

      const nameHeader = screen.getByTestId("sort-name");

      await nameHeader.click();
      await nameHeader.click();
      await nameHeader.click();

      const rows = screen.container.querySelectorAll("tbody tr");
      expect(rows[0]?.textContent).toContain("Bob");
      expect(rows[1]?.textContent).toContain("Alice");
    });
  });

  describe("Handle error state", () => {
    it("shows not found error with trace id", async () => {
      mockUseAtomValue.mockReturnValue(
        AsyncResult.fail(new NotFoundError({ traceId: "trace-1" })),
      );

      const screen = await render(<UserList />);

      await expect.element(screen.getByTestId("error")).toBeInTheDocument();
      await expect
        .element(screen.getByTestId("error-title"))
        .toHaveTextContent("Unable to find users");

      const link = screen.getByRole("link");
      expect(link.element().getAttribute("href")).toContain("trace-1");
    });

    it("triggers refresh on try again click", async () => {
      const mockRefresh = vi.fn();
      mockUseAtomRefresh.mockReturnValue(mockRefresh);
      mockUseAtomValue.mockReturnValue(
        AsyncResult.fail(new NotFoundError({ traceId: "trace-1" })),
      );

      const screen = await render(<UserList />);

      await screen.getByTestId("error-refresh").click();

      expect(mockRefresh).toHaveBeenCalledOnce();
    });

    it("shows network error with trace id", async () => {
      mockUseAtomValue.mockReturnValue(
        AsyncResult.fail(new NetworkError({ traceId: "trace-2" })),
      );

      const screen = await render(<UserList />);

      await expect
        .element(screen.getByTestId("error-title"))
        .toHaveTextContent("Connection failed");

      const link = screen.getByRole("link");
      expect(link.element().getAttribute("href")).toContain("trace-2");
    });

    it("shows validation error with trace id", async () => {
      mockUseAtomValue.mockReturnValue(
        AsyncResult.fail(new ValidationError({ traceId: "trace-3" })),
      );

      const screen = await render(<UserList />);

      await expect
        .element(screen.getByTestId("error-title"))
        .toHaveTextContent("Invalid data received");

      const link = screen.getByRole("link");
      expect(link.element().getAttribute("href")).toContain("trace-3");
    });

    it("shows fallback error for unmatched error tags", async () => {
      mockUseAtomValue.mockReturnValue(
        AsyncResult.failure(Cause.fail({ _tag: "UnexpectedError" })),
      );

      const screen = await render(<UserList />);

      await expect
        .element(screen.getByTestId("error-title"))
        .toHaveTextContent("Something went wrong");
    });
  });
});
