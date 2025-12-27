import { test, expect } from "@playwright/test";

test.describe("VoxVideo Studio", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:1420");
  });

  test("displays app header", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("VoxVideo Studio");
  });

  test("has voice and text input tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: /voice input/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /text input/i })).toBeVisible();
  });

  test("switches between voice and text tabs", async ({ page }) => {
    const textTab = page.getByRole("button", { name: /text input/i });
    await textTab.click();

    await expect(
      page.getByPlaceholderText(/describe the video/i)
    ).toBeVisible();

    const voiceTab = page.getByRole("button", { name: /voice input/i });
    await voiceTab.click();

    await expect(page.getByText(/click to start recording/i)).toBeVisible();
  });

  test("displays settings panel", async ({ page }) => {
    await expect(page.getByText("Settings")).toBeVisible();
    await expect(page.getByText("Video Settings")).toBeVisible();
    await expect(page.getByText("Resolution")).toBeVisible();
  });

  test("can change resolution setting", async ({ page }) => {
    const resolutionSelect = page.locator("select").first();
    await resolutionSelect.selectOption("768px");

    await expect(resolutionSelect).toHaveValue("768px");
  });

  test("can toggle voiceover setting", async ({ page }) => {
    const voiceoverCheckbox = page.getByRole("checkbox");
    const isChecked = await voiceoverCheckbox.isChecked();

    await voiceoverCheckbox.click();

    await expect(voiceoverCheckbox).toBeChecked({ checked: !isChecked });
  });

  test("shows preview area", async ({ page }) => {
    await expect(page.getByText("Preview")).toBeVisible();
    await expect(
      page.getByText(/your generated video will appear here/i)
    ).toBeVisible();
  });

  test("shows status bar", async ({ page }) => {
    await expect(page.getByText("VoxVideo Studio v0.1.0")).toBeVisible();
    await expect(page.getByText("Ready")).toBeVisible();
  });
});

test.describe("Text Input Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:1420");
    await page.getByRole("button", { name: /text input/i }).click();
  });

  test("generate button is disabled when input is empty", async ({ page }) => {
    const generateButton = page.getByRole("button", { name: /generate video/i });
    await expect(generateButton).toBeDisabled();
  });

  test("generate button enables when text is entered", async ({ page }) => {
    const textarea = page.getByPlaceholderText(/describe the video/i);
    await textarea.fill("A beautiful sunset over the ocean");

    const generateButton = page.getByRole("button", { name: /generate video/i });
    await expect(generateButton).toBeEnabled();
  });

  test("can use example prompts", async ({ page }) => {
    const exampleButton = page.getByRole("button", { name: /sunset/i }).first();
    await exampleButton.click();

    const textarea = page.getByPlaceholderText(/describe the video/i);
    await expect(textarea).not.toHaveValue("");
  });
});

test.describe("Voice Input Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:1420");
  });

  test("shows microphone button", async ({ page }) => {
    await expect(page.getByText(/click to start recording/i)).toBeVisible();
  });

  test("shows recording instruction", async ({ page }) => {
    await expect(page.getByText(/click to start recording/i)).toBeVisible();
  });
});
