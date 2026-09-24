import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { SortedSubmissionsCategory } from '$lib/shared/goodies';

export const load: PageLoad = async ({ params }) => {
    const category = params.category;
    if (!category) {
        throw redirect(307, "/judging");
    }

    if (!Object.values(SortedSubmissionsCategory).includes(category as SortedSubmissionsCategory)) {
        throw redirect(307, "/judging");
    }
    return {
        pageMetadata: {
            title: `Judge`
        },
        pageData: {
            category: category as SortedSubmissionsCategory
        }
    };
};