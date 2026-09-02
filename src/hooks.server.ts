import type { Handle, ServerInit } from "@sveltejs/kit";
import { getTextDirection } from "$lib/paraglide/runtime";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { DatabaseManager } from "./lib/server/database";

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

export const handle: Handle = handleParaglide;