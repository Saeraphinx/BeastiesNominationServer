import { DiscordAuthHelper, SessionHelper } from '$lib/server/auth';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Judge } from '../../../../../lib/server/database';
import { Logger } from '../../../../../lib/server/logger';
import { PUBLIC_BASE_URL } from '$app/env/public';

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

    const token = await DiscordAuthHelper.getToken(code);
    if (!token) {
        throw error(400, `Invalid code.`);
    }

    const user = await DiscordAuthHelper.getUser(token.access_token);
    if (!user) {
        throw error(500, `Internal server error.`);
    }

    let judge = await Judge.findOne({ where: { discordId: user.id } });

    if (!judge) {
        let discordGuildMemberInfo = await DiscordAuthHelper.getGuildMemberData(
            token.access_token,
            `452928402203344908`,
            user.id
        );
        if (!discordGuildMemberInfo) {
            Logger.warn(`Failed to get guild member data for ${user.username}.`, `Auth`);
            throw error(500, `Internal server error.`);
        }
        if (!discordGuildMemberInfo.roles.includes(`933458558408884244`)) {
            console.log(`id ${user.id} is not a judge`);
            throw error(403, `You are not involved with The Beasties.`);
        }

        judge = await Judge.create({
            discordId: user.id,
            name: user.username,
            avatarUrl: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        });
    }

    const authSession = await SessionHelper.createAuthSession(user.id, {
        username: judge.name,
        service: `judgeId`,
        isVerified: true
    });

    cookies.set('auth_session', authSession.authSessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    throw redirect(307, `${PUBLIC_BASE_URL}/judge`);
};
