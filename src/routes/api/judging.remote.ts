import { getRequestEvent, query } from "$app/server";
import { Judge } from "../../lib/server/database";

export const getJudge = query(async () => {
    const event = getRequestEvent();
    const user = event.locals.user;

    if (!user || user.service !== `judgeId`) {
        throw new Error(`Unauthorized`);
    }

    const judge = await Judge.findOne({ where: { discordId: user.id } });
    if (!judge) {
        throw new Error(`Judge not found`);
    }
    return judge.toJSON();
});