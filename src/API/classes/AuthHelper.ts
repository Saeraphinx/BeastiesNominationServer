import { auth, server } from '../../../storage/config.json';

class OAuth2Helper {
    public static async getToken(url:string, code: string, oAuth2Data:{clientId:string, clientSecret:string}, callbackUrl:string): Promise<OAuth2Response | null> {
        if (!code || !oAuth2Data.clientId || !oAuth2Data.clientSecret || !callbackUrl || !url) {
            return null;
        }
        let tokenRequest = await fetch(url,
            {
                method: `POST`,
                body: new URLSearchParams({
                    'client_id': oAuth2Data.clientId,
                    'client_secret': oAuth2Data.clientSecret,
                    'grant_type': `authorization_code`,
                    'code': code,
                    'redirect_uri': callbackUrl,
                }),
                headers:
                {
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
            headers:
            {
                'Authorization': `Bearer ${token}`
            }
        };
    }
}

export interface OAuth2Response {
    token_type: string,
    access_token: string,
    expires_in: number,
    refresh_token?: string,
    scope: string,
}

export class BeatLeaderAuthHelper extends OAuth2Helper {
    private static readonly callbackUrl = `${server.url}/api/auth/beatleader/callback`;
    
    public static getUrl(state:string): string {
        return `https://api.beatleader.com/oauth2/authorize?client_id=${auth.beatleader.clientId}&response_type=code&scope=profile&redirect_uri=${BeatLeaderAuthHelper.callbackUrl}&state=${state}`;
    }

    public static getToken(code:string): Promise<OAuth2Response> {
        return super.getToken(`https://api.beatleader.com/oauth2/token`, code, auth.beatleader, this.callbackUrl);
    }

    public static async getUser(token: string): Promise<BeatLeaderIdentify | null> {
        const userIdRequest = await fetch(`https://api.beatleader.com/oauth2/identity`, super.getRequestData(token));
        const Idjson: BeatLeaderIdentify = await userIdRequest.json() as BeatLeaderIdentify;

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

    public static async getBeatSaverId(beatLeaderId: string): Promise<string|null> {
        let req = await fetch(`https://api.beatleader.com/player/${beatLeaderId}?stats=false`, {
            method: `GET`
        });

        if (req.status !== 200) {
            return null;
        }

        let json = await req.json() as any;
        if (`mapperId` in json) {
            return json.mapperId;
        }
    }
}

export interface BeatLeaderIdentify {
    id: string,
    name: string,
}

export interface BeatLeaderMinimalUser {
    mapperId: number
    banned: boolean
    inactive: boolean
    banDescription: string
    externalProfileUrl: string
    id: string
    name: string
    platform: string
    avatar: string
    country: string
    bot: boolean
    role: string
    socials: {
        service: string
        userId: string
        user: string
        link: string
        playerId: string
    }[]
}

export class BeatSaverAuthHelper extends OAuth2Helper {
    private static readonly callbackUrl = `${server.url}/api/auth/beatsaver/callback`;
    
    public static getUrl(state:string): string {
        return `https://beatsaver.com/oauth2/authorize?client_id=${auth.beatsaver.clientId}&response_type=code&scope=identity&redirect_uri=${BeatSaverAuthHelper.callbackUrl}&state=${state}`;
    }

    public static getToken(code:string): Promise<OAuth2Response> {
        return super.getToken(`https://api.beatsaver.com/oauth2/token`, code, auth.beatsaver, this.callbackUrl);
    }

    public static async getUser(token: string): Promise<BeatSaverIdentify | null> {
        const userIdRequest = await fetch(`https://api.beatsaver.com/oauth2/identity`, super.getRequestData(token));
        const Idjson: BeatSaverIdentify = await userIdRequest.json() as BeatSaverIdentify;

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
    private static readonly callbackUrl = `${server.url}/api/auth/discord/callback`;
    
    public static getUrl(state:string): string {
        return `https://discord.com/oauth2/authorize?client_id=${auth.discord.clientId}&response_type=code&scope=guilds.members.read+identify&redirect_uri=${DiscordAuthHelper.callbackUrl}&state=${state}`;
    }

    public static getToken(code:string): Promise<OAuth2Response> {
        return super.getToken(`https://discord.com/api/v10/oauth2/token`, code, auth.discord, this.callbackUrl);
    }

    public static async getUser(token: string): Promise<DiscordIdentify | null> {
        const userIdRequest = await fetch(`https://discord.com/api/v10/users/@me`, super.getRequestData(token));
        const Idjson: DiscordIdentify = await userIdRequest.json() as DiscordIdentify;

        if (!Idjson.id) {
            return null;
        } else {
            return Idjson;
        }
    }

    public static async getGuildMemberData(token: string, guildId: string, userId:string): Promise<DiscordUserGuild | null> {
        const userIdRequest = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, super.getRequestData(token));
        const Idjson: DiscordUserGuild = await userIdRequest.json() as DiscordUserGuild;
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
    nick?: string|null;
    avatar?: string|null;
    roles: string[];
    joined_at: Date;
    premium_since?: Date|null;
    deaf: boolean;
    mute: boolean;
    flags: number;
    pending?: boolean;
    permissions?: string;
}

// eslint-disable-next-line quotes
declare module 'express-session' {
    export interface Session {
        state: string;
        userId: string;
        username: string;
        service: `beatleader` | `beatsaver` | `judgeId`;
        beatSaverId: string;
        isVerified: boolean;
    }
}