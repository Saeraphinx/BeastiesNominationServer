import * as env from '$app/env/private';
import { PUBLIC_BASE_URL } from '$app/env/public';
import { timingSafeEqual, subtle } from 'crypto';
import path from 'path';
import { Column, DataType, Model, Sequelize, Table } from 'sequelize-typescript';
import type { InferAttributes, InferCreationAttributes } from 'sequelize/lib/model';

class OAuth2Helper {
    public static async getToken(
        url: string,
        code: string,
        oAuth2Data: { clientId: string; clientSecret: string },
        callbackUrl: string
    ): Promise<OAuth2Response | null> {
        if (!code || !oAuth2Data.clientId || !oAuth2Data.clientSecret || !callbackUrl || !url) {
            return null;
        }
        let tokenRequest = await fetch(url, {
            method: `POST`,
            body: new URLSearchParams({
                client_id: oAuth2Data.clientId,
                client_secret: oAuth2Data.clientSecret,
                grant_type: `authorization_code`,
                code: code,
                redirect_uri: callbackUrl
            }),
            headers: {
                'Content-Type': `application/x-www-form-urlencoded`
            }
        });

        const json: any = await tokenRequest.json();
        if (!json.access_token) {
            return null;
        } else {
            return json as OAuth2Response;
        }
    }

    protected static getRequestData(token: string) {
        return {
            method: `GET`,
            body: null as null,
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    }
}

export interface OAuth2Response {
    token_type: string;
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
}

export class BeatLeaderAuthHelper extends OAuth2Helper {
    private static readonly callbackUrl = `${PUBLIC_BASE_URL}/api/auth/beatleader/callback`;
    private static readonly authData = {
        clientId: env.AUTH_BEATLEADER_CLIENT_ID,
        clientSecret: env.AUTH_BEATLEADER_CLIENT_SECRET
    };

    public static getUrl(state: string): string {
        return `https://api.beatleader.com/oauth2/authorize?client_id=${this.authData.clientId}&response_type=code&scope=profile&redirect_uri=${this.callbackUrl}&state=${state}`;
    }

    public static getToken(code: string): Promise<OAuth2Response | null> {
        return super.getToken(
            `https://api.beatleader.com/oauth2/token`,
            code,
            this.authData,
            this.callbackUrl
        );
    }

    public static async getUser(token: string): Promise<BeatLeaderIdentify | null> {
        const userIdRequest = await fetch(
            `https://api.beatleader.com/oauth2/identity`,
            super.getRequestData(token)
        );
        const Idjson: BeatLeaderIdentify = (await userIdRequest.json()) as BeatLeaderIdentify;

        if (!Idjson.id) {
            return null;
        } else {
            return Idjson;
            //const userRequest = await fetch(`https://api.beatleader.com/player/${Idjson.id}?stats=false`, super.getRequestData(token));
            //const userJjson: BeatLeaderMinimalUser = await userRequest.json() as BeatLeaderMinimalUser;
            //if (!userJjson.id) {
            //    return null;
            //} else {
            //    return userJjson;
            //}
        }
    }

    public static async getBeatSaverId(beatLeaderId: string): Promise<string | null> {
        let req = await fetch(`https://api.beatleader.com/player/${beatLeaderId}?stats=false`, {
            method: `GET`
        });

        if (req.status !== 200) {
            return null;
        }

        let json = (await req.json()) as any;
        if (`mapperId` in json) {
            return json.mapperId;
        } else {
            return null;
        }
    }
}

export interface BeatLeaderIdentify {
    id: string;
    name: string;
}

export interface BeatLeaderMinimalUser {
    mapperId: number;
    banned: boolean;
    inactive: boolean;
    banDescription: string;
    externalProfileUrl: string;
    id: string;
    name: string;
    platform: string;
    avatar: string;
    country: string;
    bot: boolean;
    role: string;
    socials: {
        service: string;
        userId: string;
        user: string;
        link: string;
        playerId: string;
    }[];
}

export class BeatSaverAuthHelper extends OAuth2Helper {
    private static readonly callbackUrl = `${PUBLIC_BASE_URL}/api/auth/beatsaver/callback`;
    private static readonly authData = {
        clientId: env.AUTH_BEATSAVER_CLIENT_ID,
        clientSecret: env.AUTH_BEATSAVER_CLIENT_SECRET
    };

    public static getUrl(state: string): string {
        return `https://beatsaver.com/oauth2/authorize?client_id=${this.authData.clientId}&response_type=code&scope=identity&redirect_uri=${this.callbackUrl}&state=${state}`;
    }

    public static getToken(code: string): Promise<OAuth2Response | null> {
        return super.getToken(
            `https://api.beatsaver.com/oauth2/token`,
            code,
            this.authData,
            this.callbackUrl
        );
    }

    public static async getUser(token: string): Promise<BeatSaverIdentify | null> {
        const userIdRequest = await fetch(
            `https://api.beatsaver.com/oauth2/identity`,
            super.getRequestData(token)
        );
        const Idjson: BeatSaverIdentify = (await userIdRequest.json()) as BeatSaverIdentify;

        if (!Idjson.id) {
            return null;
        } else {
            return Idjson;
        }
    }
}

export interface BeatSaverIdentify {
    scopes: string[];
    id: string;
    name: string;
    avatar: string;
}

export class DiscordAuthHelper extends OAuth2Helper {
    private static readonly callbackUrl = `${PUBLIC_BASE_URL}/api/auth/discord/callback`;
    private static readonly authData = {
        clientId: env.AUTH_DISCORD_CLIENT_ID,
        clientSecret: env.AUTH_DISCORD_CLIENT_SECRET
    };

    public static getUrl(state: string): string {
        return `https://discord.com/oauth2/authorize?client_id=${this.authData.clientId}&response_type=code&scope=guilds.members.read+identify&redirect_uri=${DiscordAuthHelper.callbackUrl}&state=${state}`;
    }

    public static getToken(code: string): Promise<OAuth2Response | null> {
        return super.getToken(
            `https://discord.com/api/v10/oauth2/token`,
            code,
            this.authData,
            this.callbackUrl
        );
    }

    public static async getUser(token: string): Promise<DiscordIdentify | null> {
        const userIdRequest = await fetch(
            `https://discord.com/api/v10/users/@me`,
            super.getRequestData(token)
        );
        const Idjson: DiscordIdentify = (await userIdRequest.json()) as DiscordIdentify;

        if (!Idjson.id) {
            return null;
        } else {
            return Idjson;
        }
    }

    public static async getGuildMemberData(
        token: string,
        guildId: string,
        userId: string
    ): Promise<DiscordUserGuild | null> {
        const userIdRequest = await fetch(
            `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
            super.getRequestData(token)
        );
        const Idjson: DiscordUserGuild = (await userIdRequest.json()) as DiscordUserGuild;
        if (!Idjson.roles) {
            return null;
        } else {
            return Idjson;
        }
    }
}

export interface DiscordIdentify {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    global_name?: string;
}

export interface DiscordUserGuild {
    user?: any;
    nick?: string | null;
    avatar?: string | null;
    roles: string[];
    joined_at: Date;
    premium_since?: Date | null;
    deaf: boolean;
    mute: boolean;
    flags: number;
    pending?: boolean;
    permissions?: string;
}

// eslint-disable-next-line quotes
// declare module 'express-session' {
// 	export interface Session {
// 		state: string;
// 		userId: string;
// 		username: string;
// 		service: `beatleader` | `beatsaver` | `judgeId`;
// 		beatSaverId: string;
// 		isVerified: boolean;
// 	}
// }

interface AuthSession {
    id: string;
    userId: string;
    data: {
        username: string;
        service: `beatleader` | `beatsaver` | `judgeId`;
        isVerified: boolean;
    }
    secretHash: Uint8Array;
    tokenLastVerifiedAt: Date;
    createdAt: Date;
}

const authSessionExpiresInSeconds = 60 * 60 * 24 * 7; // 7 days

// https://github.com/lucia-auth/lucia/blob/main/code/auth_session.ts
export class SessionHelper {
    public static states: string[] = [];

    public static async createAuthSession(userId: string, data: { username: string; service: `beatleader` | `beatsaver` | `judgeId`; isVerified: boolean; }): Promise<AuthSessionAndAuthSessionToken> {
        const now = new Date();

        const id = this.generateRandomId();

        // Generate 32 random bytes.
        // Always use a cryptographically-secure random source.
        const secret = new Uint8Array(32);
        crypto.getRandomValues(secret);

        // It's important to use a cryptographically-secure random source.
        const secretHashBuffer = await crypto.subtle.digest("SHA-256", secret);
        const secretHash = new Uint8Array(secretHashBuffer);

        const token = id + "." + secret.toBase64();

        const authSession: AuthSession = {
            id,
            userId: userId,
            data,
            secretHash,
            tokenLastVerifiedAt: now,
            createdAt: now,
        };

        // Replace this with your own database query.
        await SessionTable.create(authSession);

        const authSessionAndAuthSessionToken: AuthSessionAndAuthSessionToken = {
            authSession,
            authSessionToken: token,
        };

        return authSessionAndAuthSessionToken;
    }

    public static async validateAuthSessionToken(authSessionToken: string): Promise<AuthSession | null> {
        const now = new Date();

        const tokenParts = authSessionToken.split(".");
        if (tokenParts.length !== 2) {
            return null;
        }
        const authSessionId = tokenParts[0];
        const encodedAuthSessionSecret = tokenParts[1];

        let authSessionSecret: Uint8Array;
        try {
            // Uint8Array.fromBase64() was recently added to JavaScript.
            authSessionSecret = Uint8Array.fromBase64(encodedAuthSessionSecret);
        } catch {
            return null;
        }

        // Replace this with your own database query.
        const authSession = await SessionTable.findByPk(authSessionId);

        // If the record doesn't exist in the database, the ID is invalid.
        if (authSession === null) {
            return null;
        }

        // Check for expiration.
        if (now.getTime() - authSession.tokenLastVerifiedAt.getTime() >= authSessionExpiresInSeconds * 1000) {
            return null;
        }

        const authSessionSecretHashBuffer = await subtle.digest("SHA-256", Buffer.from(authSessionSecret));
        const authSessionSecretHash = new Uint8Array(authSessionSecretHashBuffer);
        // Prevent any possibility of a timing attack by using a constant-time comparison.
        const secretCorrect = timingSafeEqual(authSessionSecretHash, authSession.secretHash);
        if (!secretCorrect) {
            return null;
        }

        // If at least an hour past since last token verification, update the token last verified at timestamp.
        // This pushes back the expiration.
        if (now.getTime() - authSession.tokenLastVerifiedAt.getTime() >= 60 * 60 * 1000) {
            authSession.tokenLastVerifiedAt = now;

            // Replace this with your own database query.
            await SessionTable.update(authSession, { where: { id: authSession.id } });
        }

        return authSession;
    }

    private static generateRandomId(): string {
        // Human readable alphabet (a-z, 0-9 without l, o, 0, 1 to avoid confusion).
        const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";

        // Generate 16 random bytes.
        // We're only going to use 5 bits per byte so the total entropy will be 128 * 5 / 8 = 80 bits.
        const bytes = new Uint8Array(16);

        // It's important to use a cryptographically-secure random source.
        crypto.getRandomValues(bytes);

        let id = "";
        for (let i = 0; i < bytes.length; i++) {
            // >> 3 "removes" the right-most 3 bits of the byte, leaving us with 5 bits (0-31).
            id += alphabet[bytes[i] >> 3];
        }
        return id;
    }
}

interface AuthSessionAndAuthSessionToken {
    authSession: AuthSession;
    authSessionToken: string;
}

export class SessionDatabaseManager {
    private sequelize: Sequelize;

    constructor() {
        this.sequelize = new Sequelize(`database`, `user`, `password`, {
            host: `localhost`,
            dialect: `sqlite`,
            logging: false,
            storage: path.resolve(env.DATABASE_SESSIONS_LOCATION)
        });

        this.sequelize.sync()
    }
}

@Table({
    tableName: "sessions",
    timestamps: false,
})
class SessionTable extends Model<InferAttributes<SessionTable>, InferCreationAttributes<SessionTable>> implements AuthSession {
    @Column({
        type: DataType.STRING,
        allowNull: false,
        primaryKey: true,
    })
    declare id: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare userId: string;

    @Column({
        type: DataType.JSON,
        allowNull: false,
    })
    declare data: {
        username: string;
        service: `beatleader` | `beatsaver` | `judgeId`;
        isVerified: boolean;
    }

    @Column({
        type: DataType.BLOB,
        allowNull: false,
    })
    declare secretHash: Uint8Array;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    declare tokenLastVerifiedAt: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    declare createdAt: Date;
}