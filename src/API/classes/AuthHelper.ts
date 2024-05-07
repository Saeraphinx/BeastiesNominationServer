//@ts-ignore
import { oauth2, express } from '../../../storage/config.json';

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



// eslint-disable-next-line quotes
declare module 'express-session' {
    export interface Session {
        userId: string;
    }
}