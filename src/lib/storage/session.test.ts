import { afterEach, describe, expect, it } from "vitest";
import { clearBrowserSession, readBrowserSession, writeBrowserSession } from "./session.ts";

afterEach(() => {
  clearBrowserSession();
});

describe("browser session", () => {
  it("round-trips the cadeado for this browser session", () => {
    writeBrowserSession("K7M4-2NPQ");
    expect(readBrowserSession()).toBe("K7M4-2NPQ");
  });

  it("clears the cadeado when the user locks", () => {
    writeBrowserSession("K7M4-2NPQ");
    clearBrowserSession();
    expect(readBrowserSession()).toBeNull();
  });
});
