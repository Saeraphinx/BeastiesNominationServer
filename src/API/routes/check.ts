import e, { Express } from 'express';
import { DatabaseHelper } from '../../Shared/Database';

export class TempRoute {
    private app: Express;
    private recentSubmissions: string[] = [];

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
        setInterval(() => {
            this.recentSubmissions = [];
        }, 10000);
    }

    private async loadRoutes() {
        this.app.post(`/api/submitnomination`, async (req, res) => {
            const userId = req.body[`id`].toString();
            const bsrId = req.body[`bsrId`].toString();
            const category = req.body[`category`].toString();
            const ticket = req.body[`ticket`].toString();
            const platform = req.body[`platform`].toString();

            if (!userId || !bsrId || !category || !ticket) {
                res.status(400).send(`Invalid request.`);
                return;
            }

            if (bsrId.length != 5) {
                res.status(400).send(`Invalid request.`);
                return;
            }

            this.recentSubmissions.push(bsrId);
            if (this.recentSubmissions.filter(id => id == bsrId).length > 3) {
                res.status(429).send(`Rate Limited.`);
                return;
            }

            let gameId;
            if (platform == `steam`) {
                let steamResponse = await fetch(`https://api.steampowered.com/ISteamUserAuth/AuthenticateUserTicket/v1?key=${steam.key}&appid=620980&ticket=${ticket}`);
                if (steamResponse.status != 200) {
                    res.status(500).send(`Internal server error.`);
                    return;
                }
                let steamjsonResponse = await steamResponse.json() as { steamid?: string };
                if (!steamjsonResponse && !steamjsonResponse.steamid) {
                    res.status(400).send(`Invalid request.`);
                    return;
                }
                gameId = steamjsonResponse.steamid;
            } else if (platform == `oculus`) {
                res.status(400).send(`Invalid request.`);
                return;
                let oculusResponse = await fetch(`https://graph.oculus.com/app?access_token=${ticket}`);

            } else {
                res.status(400).send(`Invalid request.`);
                return;
            }

            let status = await DatabaseHelper.addNomination(userId, bsrId, category);
            if (!status) {
                res.status(400).send(`Invalid request.`);
                return;
            }
            res.status(200).send({ message : `Nomination submitted.` });
        });
    }
}