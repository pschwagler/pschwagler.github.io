import { toggleTheme } from "./use-theme";

describe("toggleTheme", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  it("adds dark class when currently light", () => {
    toggleTheme();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class when currently dark", () => {
    document.documentElement.classList.add("dark");

    toggleTheme();

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists 'dark' to localStorage when switching to dark", () => {
    toggleTheme();

    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("persists 'light' to localStorage when switching to light", () => {
    document.documentElement.classList.add("dark");

    toggleTheme();

    expect(localStorage.getItem("theme")).toBe("light");
  });
});
