import { defineEnvVars } from "@sveltejs/kit/env";
import { z } from "zod";

export const variables = defineEnvVars({
    AUTH_DISCORD_CLIENT_ID: { schema: z.string().optional() },
    AUTH_DISCORD_CLIENT_SECRET: { schema: z.string().optional() },
    AUTH_BEATSAVER_CLIENT_ID: { schema: z.string().optional() },
    AUTH_BEATSAVER_CLIENT_SECRET: { schema: z.string().optional() },
    AUTH_BEATLEADER_CLIENT_ID: { schema: z.string().optional() },
    AUTH_BEATLEADER_CLIENT_SECRET: { schema: z.string().optional() },

    API_BEATLEADER_KEY: { schema: z.string().optional() },

    DATABASE_LOCATION: {
        schema: z.string().default(`./storage/database.sqlite`),
    },
    DATABASE_SESSIONS_LOCATION: {
        schema: z.string().default(`./storage/sessions.sqlite`),
    },

    SESSION_COOKIE_NAME: {
        schema: z.string().default(`bns_session`),
    },

    LOGGER_URL: { schema: z.url().optional() },

    PUBLIC_BASE_URL: { public: true, schema: z.string().default(`http://localhost:5173`) },
});
