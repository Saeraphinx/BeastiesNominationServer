import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { getJudge } from '../api/judging.remote';

export const load: LayoutLoad = async ({ data, parent, fetch, url }) => {
    let parentData = await parent();
    
    if (!parentData.user) {
        throw redirect(307, "/api/auth/discord");
    } else if (parentData.user.service !== `judgeId`) {
        throw redirect(307, "/");
    }

    const judge = await getJudge();
    if (!judge) {
        throw redirect(307, "/");
    }

    const isAdmin = judge.roles.includes("admin");
    if (
        !isAdmin && (
            url.pathname.startsWith("/judging/admin") && !judge.roles.includes("admin") ||
            url.pathname.startsWith("/judging/sort") && !judge.roles.includes("sort") ||
            url.pathname.startsWith("/judging/judge") && !judge.roles.includes("judge")
        )
    ) {
        throw redirect(307, "/judging");
    } 

    return {
        fetch: fetch,
        user: parentData.user,
        judge,
        pageMetadata: {
            title: `Judge Panel`
        }
    };
};