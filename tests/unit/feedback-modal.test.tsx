import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeedbackModal } from "@/components/feedback/feedback-modal";
import {
  ApiRequestError,
  apiRequest,
} from "@/lib/queryClient";
import {
  FEEDBACK_TEXT_MAX_LENGTH,
  FEEDBACK_TEXT_TOO_LONG_CODE,
  FEEDBACK_TEXT_TOO_LONG_MESSAGE,
} from "@shared/feedback";

const mocks = vi.hoisted(() => ({
  toast: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/lib/queryClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/queryClient")>("@/lib/queryClient");

  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

describe("FeedbackModal", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submits feedback at the shared length boundary", async () => {
    vi.mocked(apiRequest).mockResolvedValue(new Response(null, { status: 200 }));
    const onClose = vi.fn();
    const feedbackText = "x".repeat(FEEDBACK_TEXT_MAX_LENGTH);

    render(<FeedbackModal isOpen onClose={onClose} currentPage="/cook" />);

    fireEvent.change(screen.getByPlaceholderText("Share your thoughts, suggestions, or report any issues..."), {
      target: { value: feedbackText },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith("POST", "/api/feedback", {
        feedbackText,
        currentPage: "/cook",
      });
    });
    expect(mocks.toast).toHaveBeenCalledWith({
      title: "Feedback received!",
      description: "Thank you for your feedback. We appreciate your input.",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("blocks over-limit drafts before submitting", () => {
    render(<FeedbackModal isOpen onClose={vi.fn()} currentPage="/cook" />);

    fireEvent.change(screen.getByPlaceholderText("Share your thoughts, suggestions, or report any issues..."), {
      target: { value: "x".repeat(FEEDBACK_TEXT_MAX_LENGTH + 1) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(apiRequest).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith({
      title: "Feedback too long",
      description: FEEDBACK_TEXT_TOO_LONG_MESSAGE,
      variant: "destructive",
    });
  });

  it("keeps the draft when the server returns a feedback length error", async () => {
    const feedbackText = "Boundary mismatch regression";
    vi.mocked(apiRequest).mockRejectedValue(new ApiRequestError({
      status: 400,
      statusText: "Bad Request",
      body: {
        code: FEEDBACK_TEXT_TOO_LONG_CODE,
        message: FEEDBACK_TEXT_TOO_LONG_MESSAGE,
      },
      responseText: JSON.stringify({
        code: FEEDBACK_TEXT_TOO_LONG_CODE,
        message: FEEDBACK_TEXT_TOO_LONG_MESSAGE,
      }),
    }));

    render(<FeedbackModal isOpen onClose={vi.fn()} currentPage="/cook" />);

    const textarea = screen.getByPlaceholderText("Share your thoughts, suggestions, or report any issues...");
    fireEvent.change(textarea, {
      target: { value: feedbackText },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "Feedback too long",
        description: FEEDBACK_TEXT_TOO_LONG_MESSAGE,
        variant: "destructive",
      });
    });
    expect(textarea).toHaveValue(feedbackText);
  });
});
