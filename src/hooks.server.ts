import type { Handle, ServerInit } from "@sveltejs/kit";
import { getTextDirection } from "$lib/paraglide/runtime";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { DatabaseManager } from "./lib/server/database";
import { SESSION_COOKIE_NAME } from "$app/env/private";
import { SessionHelper } from "./lib/server/auth";
import { building } from "$app/env";

export const init: ServerInit = async () => {
    // Initialize the database
    let db = new DatabaseManager();

}

const handleParaglide: Handle = ({ event, resolve }) =>
    paraglideMiddleware(event.request, ({ request, locale }) => {
        event.request = request;

        return resolve(event, {
            transformPageChunk: ({ html }) =>
                html
                    .replace("%paraglide.lang%", locale)
                    .replace("%paraglide.dir%", getTextDirection(locale)),
        });
    });

export const handle: Handle = async (input) => {
    let sessionCookie = input.event.cookies.get(SESSION_COOKIE_NAME);
    if (sessionCookie && !building) {
        let user = await SessionHelper.validateAuthSessionToken(sessionCookie);
        if (user) {
            input.event.locals.user = {
                id: user.userId,
                username: user.data.username,
                service: user.data.service,
                isVerified: user.data.isVerified
            };
        } else {
            input.event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
        }
    }
    return handleParaglide(input);
}