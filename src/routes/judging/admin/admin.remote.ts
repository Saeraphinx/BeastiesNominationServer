import { command, query } from "$app/server";
import type { InferAttributes, WhereOptions } from "sequelize";
import { getJudgeFromEvent } from "../../../lib/server/auth";
import { Judge, JudgeVote, SortedSubmission } from "../../../lib/server/database";
import { z } from "zod";
import { isNameRequiredSortedSubmission, SortedSubmissionsCategory } from "../../../lib/shared/goodies";
import { getBeatSaverMaps } from "../../api/judging.remote";


// #region User Management
export const getUsers = query(async () => {
    const { judge } = await getJudgeFromEvent(); 
    if (!judge.roles.includes("admin")) {
        throw new Error("Unauthorized");
    }

    return (await Judge.findAll()).map(judge => judge.toJSON());
});

export const editUserRole = command(z.object({
    judgeId: z.number(),
    role: z.enum([`sort`, `judge`]),
    addOrRemove: z.enum([`add`, `remove`])
}), async ({ judgeId, role, addOrRemove }) => {
    const { judge } = await getJudgeFromEvent(); 
    if (!judge.roles.includes("admin")) {
        throw new Error("Unauthorized");
    }

    const targetJudge = await Judge.findByPk(judgeId);
    if (!targetJudge) {
        throw new Error("Judge not found");
    }

    if (addOrRemove === `add`) {
        targetJudge.roles = Array.from(new Set([...targetJudge.roles, role]));
    } else if (addOrRemove === `remove`) {
        targetJudge.roles = targetJudge.roles.filter(r => r !== role);
    }

    await targetJudge.save();
    return targetJudge.toJSON();
});

export const setUserCategories = command(z.object({
    judgeId: z.number(),
    categories: z.array(z.string())
}), async ({ judgeId, categories }) => {
    const { judge } = await getJudgeFromEvent(); 
    if (!judge.roles.includes("admin")) {
        throw new Error("Unauthorized");
    }

    const targetJudge = await Judge.findByPk(judgeId);
    if (!targetJudge) {
        throw new Error("Judge not found");
    }

    targetJudge.permittedCategories = categories;
    await targetJudge.save();
    return targetJudge.toJSON();
});
// #endregion User Management

// #region Vote Management
export const resetVotes = command(z.object({
    category: z.string(),
    judgeId: z.number().optional()
}), async ({ category, judgeId }) => {
    const { judge } = await getJudgeFromEvent(); 
    if (!judge.roles.includes("admin")) {
        throw new Error("Unauthorized");
    }

    const submissionIds = await SortedSubmission.findAll({
        where: { category },
        attributes: ["id"]
    }).then(submissions => submissions.map(submission => submission.id));

    let whereOptions: WhereOptions<InferAttributes<JudgeVote>> = {
        submissionId: submissionIds
    };
    if (judgeId !== undefined) {
        whereOptions.judgeId = judgeId;
    }

    let updated = await JudgeVote.update({ score: `-1` }, { where: whereOptions });

    return { success: true, count: updated[0] };
});

export const moveSubmission = command(z.object({
    submissionId: z.number(),
    newCategory: z.enum(SortedSubmissionsCategory)
}), async ({ submissionId, newCategory }) => {
    const { judge } = await getJudgeFromEvent(); 
    if (!judge.roles.includes("admin")) {
        throw new Error("Unauthorized");
    }

    const submission = await SortedSubmission.findByPk(submissionId);
    if (!submission) {
        throw new Error("Submission not found");
    }

    submission.category = newCategory;
    await submission.save();
    let updated = await JudgeVote.destroy({ where: { submissionId } });
    return { submission: submission.toJSON(), deletedVotesCount: updated };
});

export const updateNullValues = command(async () => {
    const { judge } = await getJudgeFromEvent(); 
    if (!judge.roles.includes("admin")) {
        throw new Error("Unauthorized");
    }

    const hasNullValues = await SortedSubmission.findAll({
        where: { 
            hash: null
        }
    }).then(s => s.filter(submission => isNameRequiredSortedSubmission(submission.category)));

    const mapIds = hasNullValues.map(submission => submission.bsrId).filter(id => id !== null);
    const mapData = await getBeatSaverMaps(mapIds);
    
    let updatedCount = 0;
    for (const submission of hasNullValues) {
        const map = mapData.find(m => m.id === submission.bsrId);
        if (map) {
            let newHash = map.versions[0].hash;
            let involvedMappers: string[] = [map.uploader.id.toString()];
            if (map.collaborators) {
                involvedMappers.push(...map.collaborators.map(c => c.id.toString()));
            }
            await submission.update({ 
                hash: newHash,
                involvedMappers: involvedMappers
            });
            updatedCount++;
        }
    }

    return { success: true, updatedCount };
});