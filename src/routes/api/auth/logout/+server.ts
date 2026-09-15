import type { RequestHandler } from "./$types";
import { SESSION_COOKIE_NAME } from "$app/env/private";
import { DiscordAuthHelper, SessionHelper, createRandomString } from "../../../../lib/server/auth";
import { error, redirect } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url, cookies, getClientAddress }) => {
    let state = createRandomString(16);
    let sessionCookie = cookies.get(SESSION_COOKIE_NAME);
    if (sessionCookie) {
        let session = await SessionHelper.validateAuthSessionToken(sessionCookie);
        if (session) {
            cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
            await SessionHelper.invalidateSession(session);
            throw redirect(307, "/");
        } else {
            throw error(400, `You are not logged in.`);
        }
    }
};
