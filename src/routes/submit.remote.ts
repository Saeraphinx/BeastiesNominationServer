import { form, getRequestEvent } from "$app/server";
import { z } from "zod";
import { SubmissionCategory, CharacteristicEnum, DifficultyEnum, RequestSubmissionStatus } from "$lib/shared/goodies";
import { SessionHelper } from "../lib/server/auth";
import { SESSION_COOKIE_NAME } from "$app/env/private";
import { Submission } from "../lib/server/database";

export const submitMap = form(z.object({
        category: z.enum(SubmissionCategory),
        name: z.string().min(1).max(100),
        bsrId: z.string().optional(),
        characteristic: z.enum(CharacteristicEnum).optional(),
        difficulty: z.enum(DifficultyEnum).optional(),
    }), async (data) => {
        const event = getRequestEvent();
        const cookie = event.cookies.get(SESSION_COOKIE_NAME);
        const user = await SessionHelper.validateAuthSessionToken(cookie);

        if (!user) {
            return { success: false, message: ErrorStringKeys.NotLoggedIn };
        }

        switch (Submission.validateSubmission(data)) {
            case RequestSubmissionStatus.Invalid:
                return { success: false, message: ErrorStringKeys.InvalidSubmission };
            case RequestSubmissionStatus.InvalidCategory:
                return { success: false, message: ErrorStringKeys.InvalidCategory };
            case RequestSubmissionStatus.RateLimited:
                return { success: false, message: ErrorStringKeys.RateLimited };
            case RequestSubmissionStatus.OldKey:
                return { success: false, message: ErrorStringKeys.OldKey };
        }

        const submissionResult = await Submission.sendSubmission(user.id, user.data.service, data);
        switch (submissionResult) {
            case RequestSubmissionStatus.Invalid:
                return { success: false, message: ErrorStringKeys.InvalidSubmission };
            case RequestSubmissionStatus.InvalidCategory:
                return { success: false, message: ErrorStringKeys.InvalidCategory };
            case RequestSubmissionStatus.AlreadyVoted:
                return { success: false, message: ErrorStringKeys.AlreadyVoted };
            case RequestSubmissionStatus.RateLimited:
                return { success: false, message: ErrorStringKeys.RateLimited };
            case RequestSubmissionStatus.OldKey:
                return { success: false, message: ErrorStringKeys.OldKey };
            case RequestSubmissionStatus.Success:
                return { success: true, message: ErrorStringKeys.Success };
            default:
                return { success: false, message: ErrorStringKeys.InvalidRequest };
        }
    }
);

enum ErrorStringKeys {
    NotLoggedIn = "submission.error.notLoggedIn",
    InvalidRequest = "submission.error.invalidRequest",
    InvalidCategory = "submission.error.invalidCategory",
    RateLimited = "submission.error.rateLimited",
    OldKey = "submission.error.oldKey",
    InvalidSubmission = "submission.error.invalidSubmission",
    AlreadyVoted = "submission.error.alreadyVoted",
    Success = "submission.success"
}