import type { Handle, ServerInit } from "@sveltejs/kit";
import { getTextDirection } from "$lib/paraglide/runtime";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { DatabaseManager } from "./lib/server/database";
import { AUTH_BEATLEADER_CLIENT_SECRET, SESSION_COOKIE_NAME, AUTH_BEATLEADER_CLIENT_ID, AUTH_BEATSAVER_CLIENT_ID, AUTH_BEATSAVER_CLIENT_SECRET, AUTH_DISCORD_CLIENT_ID, AUTH_DISCORD_CLIENT_SECRET } from "$app/env/private";
import { SessionDatabaseManager, SessionHelper } from "./lib/server/auth";
import { building } from "$app/env";

export const init: ServerInit = async () => {
    // Initialize the database
    let db = new DatabaseManager();
    let sessions = new SessionDatabaseManager();
    
    if (!AUTH_BEATLEADER_CLIENT_ID || !AUTH_BEATLEADER_CLIENT_SECRET) {
        console.warn("Beatleader auth not set");
    }

    if (!AUTH_BEATSAVER_CLIENT_ID || !AUTH_BEATSAVER_CLIENT_SECRET) {
        console.warn("Beatsaver auth not set");
    }

    if (!AUTH_DISCORD_CLIENT_ID || !AUTH_DISCORD_CLIENT_SECRET) {
        console.warn("Discord auth not set");
    }
    
};

const handleParaglide: Handle = ({ event, resolve }) =>
    paraglideMiddleware(event.request, ({ request, locale }) => {
        event.request = request;

        return resolve(event, {
            transformPageChunk: ({ html }) => html.replace("%paraglide.lang%", locale).replace("%paraglide.dir%", getTextDirection(locale)),
        });
    });

export const handle: Handle = async (input) => {
    if (input.event.url.pathname.endsWith(".png")) {
        return handleParaglide(input);
    }
    let sessionCookie = input.event.cookies.get(SESSION_COOKIE_NAME);
    if (sessionCookie && !building) {
        let user = await SessionHelper.validateAuthSessionToken(sessionCookie);
        if (user) {
            input.event.locals.user = {
                id: user.userId,
                ...user.data
            };
        } else {
            //input.event.cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
        }
    }
    return handleParaglide(input);
};
