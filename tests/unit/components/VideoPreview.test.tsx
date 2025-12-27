import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import VideoPreview from "@/components/VideoPreview";
import type { JobStatus } from "@/types";

const mockSetCurrentJob = vi.fn();

vi.mock("@/stores/appStore", () => ({
  useAppStore: () => ({
    currentJob: null,
    setCurrentJob: mockSetCurrentJob,
  }),
}));

vi.mock("@/services/api", () => ({
  api: {
    getVideoUrl: (jobId: string) => `http://localhost:8000/api/v1/video/${jobId}`,
  },
}));

describe("VideoPreview", () => {
  it("shows placeholder when no video", () => {
    render(<VideoPreview />);

    expect(
      screen.getByText(/your generated video will appear here/i)
    ).toBeInTheDocument();
  });

  it("renders preview heading", () => {
    render(<VideoPreview />);

    expect(screen.getByText("Preview")).toBeInTheDocument();
  });
});

describe("VideoPreview with job", () => {
  it("shows progress when job is running", () => {
    const mockJob: JobStatus = {
      job_id: "test-123",
      status: "running",
      progress: 0.5,
      result: null,
      error: null,
    };

    vi.mocked(
      vi.importActual<typeof import("@/stores/appStore")>("@/stores/appStore")
    );

    vi.doMock("@/stores/appStore", () => ({
      useAppStore: () => ({
        currentJob: mockJob,
        setCurrentJob: mockSetCurrentJob,
      }),
    }));
  });

  it("shows error message when job fails", () => {
    const mockJob: JobStatus = {
      job_id: "test-123",
      status: "failed",
      progress: 0.3,
      result: null,
      error: "GPU out of memory",
    };

    vi.doMock("@/stores/appStore", () => ({
      useAppStore: () => ({
        currentJob: mockJob,
        setCurrentJob: mockSetCurrentJob,
      }),
    }));
  });
});
