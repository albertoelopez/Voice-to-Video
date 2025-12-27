import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TextInput from "@/components/TextInput";

vi.mock("@/stores/appStore", () => ({
  useAppStore: () => ({
    setCurrentJob: vi.fn(),
    settings: {
      generation: {
        generateVoiceover: true,
        voiceReferenceId: null,
        resolution: "256px",
        numFrames: 129,
      },
    },
  }),
}));

vi.mock("@/services/api", () => ({
  api: {
    startPipeline: vi.fn().mockResolvedValue({ job_id: "test-job-id" }),
    getJobStatus: vi.fn().mockResolvedValue({
      job_id: "test-job-id",
      status: "completed",
      progress: 1.0,
    }),
  },
}));

describe("TextInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders text input with placeholder", () => {
    render(<TextInput />);

    expect(
      screen.getByPlaceholderText(/describe the video/i)
    ).toBeInTheDocument();
  });

  it("renders example prompts", () => {
    render(<TextInput />);

    expect(screen.getByText(/try these examples/i)).toBeInTheDocument();
  });

  it("updates textarea when typing", () => {
    render(<TextInput />);

    const textarea = screen.getByPlaceholderText(/describe the video/i);
    fireEvent.change(textarea, { target: { value: "A sunset over mountains" } });

    expect(textarea).toHaveValue("A sunset over mountains");
  });

  it("disables generate button when textarea is empty", () => {
    render(<TextInput />);

    const button = screen.getByRole("button", { name: /generate video/i });
    expect(button).toBeDisabled();
  });

  it("enables generate button when textarea has content", () => {
    render(<TextInput />);

    const textarea = screen.getByPlaceholderText(/describe the video/i);
    fireEvent.change(textarea, { target: { value: "A sunset" } });

    const button = screen.getByRole("button", { name: /generate video/i });
    expect(button).not.toBeDisabled();
  });
});
