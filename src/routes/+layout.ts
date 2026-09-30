import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
    return {
        user: data.user
    } satisfies Awaited<ReturnType<LayoutLoad>>;
};