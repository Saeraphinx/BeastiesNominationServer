import { command, getRequestEvent, query } from "$app/server";
import { TTLCache } from "@isaacs/ttlcache";
import { z } from "zod";
import { getBulkMaps } from "../../lib/shared/getMap";
import { Judge, JudgeVote, SortedSubmission } from "../../lib/server/database";
import { SortedSubmissionsCategory } from "../../lib/shared/goodies";
import { getJudgeFromEvent } from "../../lib/server/auth";
import type { BSMap } from "../../lib/shared/beatsaverTypes";
import { Op } from "sequelize";

export const getJudge = query(async () => {
    const { judge } = await getJudgeFromEvent();
    return judge.toJSON();
});

export const getSortedSubmissions = query(z.object({
    category: z.enum(SortedSubmissionsCategory)
}), async (input) => {
    const { judge } = await getJudgeFromEvent();
    if (judge.roles.includes("judge")) {
        if (!judge.permittedCategories.includes(input.category)) {
            if (!judge.roles.includes("admin")) {
                throw new Error("Unauthorized");
            }
        }
    }

    return SortedSubmission.findAll({
        where: {
            category: input.category
        }
    }).then(submissions => submissions.map(submission => submission.toJSON()));
});


const cache = new TTLCache<string, BSMap | null>({ max: 1000, ttl: 1000 * 60 * 60 * 24 });
export const getBeatSaverMaps = query(z.array(z.string()), async (input) => {
    const { judge } = await getJudgeFromEvent();

    if (!input || input.length === 0) {
        return [];
    }

    const cachedMaps = input.map(id => cache.get(id)).filter((id) => id !== undefined);
    if (cachedMaps.length === input.length) {
        return cachedMaps.filter((id) => id !== null);
    }

    const uncachedMapIds = input.filter(id => !cache.has(id));
    const fetchedMaps: BSMap[] = [];
    const chunks: string[][] = [];
    for (let i = 0; i < uncachedMapIds.length; i += 50) {
        chunks.push(uncachedMapIds.slice(i, i + 50));
    }
    for (const chunk of chunks) {
        // fetch the maps for each chunk and merge into fetchedMaps
        await getBulkMaps(chunk).then(data => {
            for (const id in data) {
                console.log(`Cached map with ID: ${id}`);
                if (data[id]) {
                    fetchedMaps.push(data[id]);
                    cache.set(id, data[id]);
                }
            }
            for (const id of chunk) {
                if (!Object.keys(data).includes(id)) {
                    console.log(`Map with ID: ${id} was not found in the fetched data.`);
                    cache.set(id, null);
                }
            }
        });
    }

    return [...cachedMaps.filter((id) => id !== null), ...fetchedMaps];
});

export const getVotes = query(z.object({
    submissionIds: z.array(z.number())
}), async (input) => {
    const { judge } = await getJudgeFromEvent();

    if (!judge.roles.includes("judge")) {
        throw new Error("Unauthorized");
    }

    const votes = await JudgeVote.findAll({
        where: {
            submissionId: input.submissionIds,
            judgeId: judge.id
        }
    });

    return votes.map(vote => vote.toJSON());
});

export const getJudgeStats = query(async () => {
    const { judge } = await getJudgeFromEvent();

    if (!judge.roles.includes("judge")) {
        throw new Error("Unauthorized");
    }

    const allSubmissions = await SortedSubmission.findAll({
        where: {
            category: judge.permittedCategories
        }
    // convert to record categoryname, object
    }).then(submissions => {
        let submissionsByCategory: Record<string, SortedSubmission[]> = {};
        for (const submission of submissions) {
            if (!submissionsByCategory[submission.category]) {
                submissionsByCategory[submission.category] = [];
            }
            submissionsByCategory[submission.category].push(submission);
        }
        return submissionsByCategory;
    });
    const submissionIds = Object.values(allSubmissions).flat().map(submission => submission.id);

    const votes = await JudgeVote.findAll({
        where: {
            judgeId: judge.id,
            submissionId: submissionIds,
            score: {[Op.ne]: `0`}
        },
        attributes: ['submissionId']
    });

    const retVal: Record<string, { submissionCount: number, votes: number }> = {

    };

    for (const category in allSubmissions) {
        const submissions = allSubmissions[category];
        const submissionCount = submissions.length;
        const votesCount = votes.filter(vote => submissions.some(submission => submission.id === vote.submissionId)).length;
        retVal[category] = {
            submissionCount,
            votes: votesCount
        };
    }

    return retVal;
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