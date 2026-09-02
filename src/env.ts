import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

export const variables = defineEnvVars({
	AUTH_DISCORD_CLIENT_ID: { static: true },
    AUTH_DISCORD_CLIENT_SECRET: { static: true },
    AUTH_BEATSAVER_CLIENT_ID: { static: true },
    AUTH_BEATSAVER_CLIENT_SECRET: { static: true },
    AUTH_BEATLEADER_CLIENT_ID: { static: true },
    AUTH_BEATLEADER_CLIENT_SECRET: { static: true },

    DATABASE_LOCATION: { 
        static: true,
        schema: z.string().default(`./storage/database.sqlite`)
    },
    DATABASE_SESSIONS_LOCATION: { 
        static: true,
        schema: z.string().default(`./storage/sessions.sqlite`)
    },

    SESSION_COOKIE_NAME: { 
        static: true, 
        schema: z.string().default(`bns_session`) 
    },

    LOGGER_URL: { static: true, schema: z.url().optional() },

    PUBLIC_BASE_URL: { static: true, public: true },
});