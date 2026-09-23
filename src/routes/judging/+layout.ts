import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { getJudge } from '../api/judging.remote';

export const load: LayoutLoad = async ({ data, parent, fetch }) => {
    let parentData = await parent();
    
    if (!parentData.user) {
        throw redirect(307, "/api/auth/discord");
    } else if (parentData.user.service !== `judgeId`) {
        throw redirect(307, "/");
    }

    const judge = await getJudge();

    return {
        fetch: fetch,
        user: parentData.user,
        judge,
        pageMetadata: {
            title: `Judge Panel`
        }
    };
};