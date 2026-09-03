import { BeatLeaderAuthHelper, DiscordAuthHelper, SessionHelper } from '$lib/server/auth';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Judge } from '../../../../../lib/server/database';
import { Logger } from '../../../../../lib/server/logger';
import { PUBLIC_BASE_URL } from '$app/env/public';
import { SESSION_COOKIE_NAME } from '$app/env/private';

export const GET: RequestHandler = async ({ url, cookies, getClientAddress }) => {
    const state = url.searchParams.get('state');
    const code = url.searchParams.get('code');

    if (!state || !code) {
        throw error(400, `Missing state or code.`);
    }

    if (!SessionHelper.states.includes(state + getClientAddress())) {
        throw error(400, `Invalid state.`);
    } else {
        SessionHelper.states = SessionHelper.states.filter((s) => s !== state + getClientAddress());
    }

    const token = await BeatLeaderAuthHelper.getToken(code);
    if (!token) {
        throw error(400, `Invalid code.`);
    }

    const user = await BeatLeaderAuthHelper.getUser(token.access_token);
    if (!user) {
        throw error(500, `Internal server error.`);
    }

    const authSession = await SessionHelper.createAuthSession(user.id, {
        username: user.name,
        service: `beatleader`,
        isVerified: true
    });

    cookies.set(SESSION_COOKIE_NAME, authSession.authSessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    throw redirect(307, `${PUBLIC_BASE_URL}/judge`);
};
