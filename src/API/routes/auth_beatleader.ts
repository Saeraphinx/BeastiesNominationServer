import { Express } from 'express';
import { BeatLeaderAuthHelper } from '../classes/AuthHelper';
import { HTTPTools } from '../classes/HTTPTools';

export class BeatLeaderAuthRoutes {
    private app: Express;
    private validStates: string[] = [];

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        this.app.get(`/api/auth`, async (req, res) => {
            if (req.session.userId) {
                return res.status(200).send({ message: `Hello, ${req.session.username}!` });
            } else {
                return res.status(401).send({ error: `Not logged in.` });
            }
        });

        this.app.get(`/api/auth/beatleader`, async (req, res) => {
            let state = HTTPTools.createRandomString(16);
            //req.session.state = state;
            //req.session.save();
            this.validStates.push(state + req.ip);
            setTimeout(() => {
                this.validStates = this.validStates.filter((s) => s !== state + req.ip);
            }, 1000 * 60 * 3);
            return res.redirect(302, BeatLeaderAuthHelper.getUrl(state));
        });

        this.app.get(`/api/auth/beatleader/callback`, async (req, res) => {
            const code = req.query[`code`].toString();
            const state = req.query[`state`].toString();
            //if (state !== req.session.state) {
            //    return res.status(400).send({ error: `Invalid state.` });
            //}
            if (!this.validStates.includes(state + req.ip)) {
                return res.status(400).send({ error: `Invalid state.` });
            }
            this.validStates = this.validStates.filter((s) => s !== state);
            let token = BeatLeaderAuthHelper.getToken(code);
            if (!token) { return res.status(400).send({ error: `Invalid code.` }); }
            let user = await BeatLeaderAuthHelper.getUser((await token).access_token);
            if (!user) { return res.status(500).send({ error: `Internal server error.` }); }

            req.session.userId = user.id;
            req.session.username = user.name;
            req.session.save();
            return res.status(200).send({ message: `Successfully logged in.` }).redirect(302, `/`); // i need to double check that this is the correct way to redirect
        });
    }
}