import { z } from "zod";

export const FEEDBACK_TEXT_MAX_LENGTH = 300;
export const FEEDBACK_CURRENT_PAGE_MAX_LENGTH = 120;
export const FEEDBACK_TEXT_TOO_LONG_CODE = "FEEDBACK_TEXT_TOO_LONG";
export const FEEDBACK_TEXT_TOO_LONG_MESSAGE = `Feedback can be ${FEEDBACK_TEXT_MAX_LENGTH} characters or fewer. Please shorten it and try again.`;

export const feedbackTextSchema = z.string().trim().min(1).max(FEEDBACK_TEXT_MAX_LENGTH);
export const feedbackCurrentPageSchema = z.string().trim().min(1).max(FEEDBACK_CURRENT_PAGE_MAX_LENGTH);
