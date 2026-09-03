import type { RequestHandler } from './$types';
import { SubmissionCategory, submissionEndDate, CharacteristicEnum, DifficultyEnum, RequestSubmissionStatus } from '$lib/shared/goodies';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { createHash, timingSafeEqual } from 'crypto';
import { Submission } from '../../../../lib/server/database';

export const POST: RequestHandler = async ({ request }) => {
    if (new Date() > submissionEndDate) {
        return json({ message: `Submissions are now closed. Thank you for participating!` }, { status: 403 });
    }

    const input = z.object({
        category: z.enum(SubmissionCategory),
        bsrId: z.string().optional(),
        characteristic: z.enum(CharacteristicEnum).optional(),
        difficulty: z.enum(DifficultyEnum).optional(),
        userId: z.string(),
    }).safeParse(await request.json());

    if (!input.success) {
        return json({ message: `Invalid input: ${input.error.message}`, error: input.error }, { status: 400 });
    }

    const apiKey = request.headers.get('Authorization');
    // make 2 equal length buffers to prevent timing attacks
    const apiKeyBuffer = Buffer.from(createHash('sha256').update(apiKey || '').digest());
    const submissionApiKeyBuffer = Buffer.from(createHash('sha256').update(`Bearer ${process.env.SUBMISSION_API_KEY}` || '').digest());

    if (!apiKey || !process.env.SUBMISSION_API_KEY || !timingSafeEqual(apiKeyBuffer, submissionApiKeyBuffer)) {
        return json({ message: `Unauthorized` }, { status: 401 });
    }

    switch (Submission.validateSubmission(input.data)) {
        case RequestSubmissionStatus.Invalid:
            return json({ message: `One or more fields is invalid` }, { status: 400 });
        case RequestSubmissionStatus.InvalidCategory:
            return json({ message: `Invalid category.` }, { status: 400 });
        case RequestSubmissionStatus.RateLimited:
            return json({ message: `Rate limited.` }, { status: 429 });
        case RequestSubmissionStatus.OldKey:
            return json({ message: `This key is not eligble for submission.` }, { status: 400 });
    }

    const submissionResult = await Submission.sendSubmission(input.data.userId || ``, `beatleader`, input.data);
    switch (submissionResult) {
        case RequestSubmissionStatus.Invalid:
            return json({ message: `Invalid submission.` }, { status: 400 });
        case RequestSubmissionStatus.InvalidCategory:
            return json({ message: `Invalid category.` }, { status: 400 });
        case RequestSubmissionStatus.AlreadyVoted:
            return json({ message: `Already voted.` }, { status: 400 });
        case RequestSubmissionStatus.RateLimited:
            return json({ message: `Rate limited.` }, { status: 429 });
        case RequestSubmissionStatus.OldKey:
            return json({ message: `This key is not eligible for submission.` }, { status: 400 });
        case RequestSubmissionStatus.Success:
            return json({ message: `Submission successful.` }, { status: 200 });
    }
}