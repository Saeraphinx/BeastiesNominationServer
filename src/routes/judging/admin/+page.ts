import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data, parent, fetch }) => {
    let parentData = await parent();
    if (!parentData.user) {
        throw redirect(307, "/api/auth/discord");
    } else if (parentData.user.service !== `judgeId`) {
        throw redirect(307, "/");
    } else if (parentData.judge.roles && !parentData.judge.roles.includes(`admin`)) {
        throw redirect(307, "/judging");
    }
    
    return {
        fetch: fetch,
        user: parentData.user,
        judge: parentData.judge,
        pageMetadata: {
            title: `Judge Panel`
        }
    };
};