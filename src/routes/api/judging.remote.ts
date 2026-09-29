import { command, getRequestEvent, query } from "$app/server";
import { TTLCache } from "@isaacs/ttlcache";
import { z } from "zod";
import { getBulkMaps, getBulkUsers, getUser } from "../../lib/shared/getMap";
import { Judge, JudgeVote, SortedSubmission } from "../../lib/server/database";
import { SortedSubmissionsCategory } from "../../lib/shared/goodies";
import { getJudgeFromEvent } from "../../lib/server/auth";
import type { BSMap, BSUser } from "../../lib/shared/beatsaverTypes";
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

const userCache = new TTLCache<string, BSUser | null>({ max: 1000, ttl: 1000 * 60 * 60 * 24 });
export const getBeatSaverUsers = query(z.array(z.string()), async (input) => {
    const { judge } = await getJudgeFromEvent();

    if (!input || input.length === 0) {
        return [];
    }

    const cachedUsers = input.map(id => userCache.get(id)).filter((id) => id !== undefined);
    if (cachedUsers.length === input.length) {
        return cachedUsers.filter((id) => id !== null);
    }

    const uncachedUserIds = input.filter(id => !userCache.has(id));
    const fetchedUsers: BSUser[] = [];
    // const chunks: string[][] = [];
    // for (let i = 0; i < uncachedUserIds.length; i += 50) {
    //     chunks.push(uncachedUserIds.slice(i, i + 50));
    // }
    
    // for (const chunk of chunks) {
    //     await getBulkUsers(chunk).then(data => {
    //         for (const user of data) {
    //             console.log(`Cached user with ID: ${user.id}`);
    //             fetchedUsers.push(user);
    //             userCache.set(user.id.toString(), user);
    //         }
    //         for (const id of chunk) {
    //             if (!data.find(user => user.id.toString() == id)) {
    //                 console.log(`User with ID: ${id} was not found in the fetched data.`);
    //                 userCache.set(id.toString(), null);
    //             }
    //         }
    //     });
    // }

    // beatsaver doesn't return a lot of fields on the bulk endpoint
    // https://discord.com/channels/882730837974609940/882731668589387796/1554516122471112816
    let promises: Promise<void>[] = [];
    for (const [index, id] of uncachedUserIds.entries()) {
        promises.push(new Promise((resolve) => {
            setTimeout(() => {
                getUser(id).catch(() => null).then(user => {
                    if (user) {
                        console.log(`Cached user with ID: ${id}`);
                        fetchedUsers.push(user);
                        userCache.set(id, user);
                    } else {
                        console.log(`User with ID: ${id} was not found.`);
                        userCache.set(id, null);
                    }
                }).finally(resolve);
            }, index * 25);
        }));
    }
    await Promise.all(promises);

    return [...cachedUsers.filter((id) => id !== null), ...fetchedUsers];
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
            score: {[Op.ne]: `-1`}
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