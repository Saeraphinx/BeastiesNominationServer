import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, parent }) => {
    let parentData = await parent();
    
    if (!parentData.user) {
        throw redirect(307, "/api/auth/discord");
    } else if (parentData.user.service !== `judgeId`) {
        throw redirect(307, "/");
    }

    return {
        user: parentData.user,
        pageMetadata: {
            title: `Judge Panel`
        }
    };
};