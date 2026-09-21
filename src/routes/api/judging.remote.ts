import { command, getRequestEvent, query } from "$app/server";
import { z } from "zod";
import { Judge, JudgeVote, SortedSubmission } from "../../lib/server/database";
import { SortedSubmissionsCategory } from "../../lib/shared/goodies";
import { getJudgeFromEvent } from "../../lib/server/auth";

export const getJudge = query(async () => {
    const { judge } = await getJudgeFromEvent();
    return judge.toJSON();
});

export const getMaps = query(z.object({
    category: z.enum(SortedSubmissionsCategory)
}), async (input) => {
    const { judge } = await getJudgeFromEvent();
    if (judge.roles.includes("judge")) {
        if (!judge.permittedCategories.includes(input.category)) {
            throw new Error("Unauthorized");
        }
    } else if (!judge.roles.includes("admin")) {
        throw new Error("Unauthorized");
    }

    return SortedSubmission.findAll({
        where: {
            category: input.category
        }
    }).then(submissions => submissions.map(submission => submission.toJSON()));
});

export const vote = command(z.object({
    submissionId: z.number(),
    score: z.enum([`-1`, `0`, `0.5`, `1`]),
    note: z.string().optional()
}), async (input) => {
    const { judge } = await getJudgeFromEvent();
    if (!judge.roles.includes("judge")) {
        throw new Error("Unauthorized");
    }
    const submission = await SortedSubmission.findByPk(input.submissionId);
    if (!submission) {
        throw new Error("Submission not found");
    }

    if (!judge.permittedCategories.includes(submission.category)) {
        throw new Error("Unauthorized");
    }

    let [vote] = await JudgeVote.findOrCreate({
        where: {
            judgeId: judge.id,
            submissionId: submission.id
        },
        defaults: {
            judgeId: judge.id,
            submissionId: submission.id,
            score: input.score,
            note: input.note
        }
    });

    return await vote.update({
        score: input.score,
        note: input.note
    }).then(vote => vote.toJSON());
});