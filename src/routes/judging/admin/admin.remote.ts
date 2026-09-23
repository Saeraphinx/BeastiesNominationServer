import { query } from "$app/server";
import { getJudgeFromEvent } from "../../../lib/server/auth";
import { Judge } from "../../../lib/server/database";

export const getUsers = query(async () => {
    const { judge } = await getJudgeFromEvent(); 
    if (!judge.roles.includes("admin")) {
        throw new Error("Unauthorized");
    }

    return (await Judge.findAll()).map(judge => judge.toJSON());
});

import { z } from "zod";

export const editUserRole = query(z.object({
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

export const setUserCategories = query(z.object({
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