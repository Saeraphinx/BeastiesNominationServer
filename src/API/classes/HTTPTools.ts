import { randomInt } from 'crypto';
import { Express } from 'express';

export class HTTPTools {
    public static handleExpressShenanigans(app: Express) {
        app.disable(`x-powered-by`);
        app.use((req, res, next) => {
            res.status(404).send({message: `Unknown route.`});
        });
          
        app.use((err:any, req:any, res:any, next:any) => {
            console.error(err.stack);
            res.status(500).send({message: `Server error`});
        });
    }

    public static createRandomString(length:number): string {
        const CharSet = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`;
        let key = ``;
        for (let i = 0; i < length; i++) {
            key += CharSet[Math.floor(randomInt(8192) * (Date.now() / 100000)) % CharSet.length];
        }
        return key;
    }
}