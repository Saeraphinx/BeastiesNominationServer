import { Express } from 'express';
import { BeatLeaderAuthHelper } from '../classes/AuthHelper';
import { HTTPTools } from '../classes/HTTPTools';

export class BeatLeaderAuthRoutes {
    private app: Express;

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        this.app.get(`/api/auth/beatleader`, async (req, res) => {
            let state = HTTPTools.createRandomString(16);
            req.session.state = state;
            return res.redirect(302, BeatLeaderAuthHelper.getUrl(state));
        });

        this.app.get(`/api/auth/beatleader/callback`, async (req, res) => {
            const code = req.query[`code`].toString();
            const state = req.query[`state`].toString();
            if (state !== req.session.state) {
                return res.status(400).send({ error: `Invalid state.` });
            }
            let token = BeatLeaderAuthHelper.getToken(code);
            if (!token) { return res.status(400).send({ error: `Invalid code.` }); }
            let user = await BeatLeaderAuthHelper.getUser((await token).access_token);
            if (!user) { return res.status(500).send({ error: `Internal server error.` }); }

            req.session.userId = user.id;
            return res.status(200).send({ message: `Successfully logged in.` });
        });
    }
}