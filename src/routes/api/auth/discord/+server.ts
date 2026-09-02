import type { RequestHandler } from './$types';
import { SESSION_COOKIE_NAME } from '$app/env/private';
import { DiscordAuthHelper, SessionHelper } from '../../../../lib/server/auth';
import { error, redirect } from '@sveltejs/kit';
import { createRandomString } from '$lib/shared/goodies';

export const GET: RequestHandler = async ({ url, cookies, getClientAddress }) => {
    let state = createRandomString(16);
    let sessionCookie = cookies.get(SESSION_COOKIE_NAME);
    if (sessionCookie) {
        let session = await SessionHelper.validateAuthSessionToken(sessionCookie);
        if (session) {
            throw error(400, `You are already logged in.`);
        } else {
            cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
        }
    }
    state = createRandomString(16);
    SessionHelper.states.push(state + getClientAddress());
    throw redirect(307, DiscordAuthHelper.getUrl(state));
};