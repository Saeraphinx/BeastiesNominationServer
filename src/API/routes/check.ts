import { Express } from 'express';
import { DatabaseHelper } from '../../Shared/Database';

export class TempRoute {
    private app: Express;
    private recentConnections: string[] = [];

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
        setInterval(() => {
            this.recentConnections = [];
        }, 3000);
    }

    private async loadRoutes() {
        this.app.post(`/api/submitnomination`, async (req, res) => {
            this.recentConnections.push(req.ip);
            if (this.recentConnections.length > 5) {
                return res.status(429).send(`Too many requests.`);
            }
            const userId = req.body[`id`].toString();
            const bsrId = req.body[`bsrId`].toString();
            const category = req.body[`category`].toString();

            if (!userId || !bsrId || !category) {
                res.status(400).send(`Invalid request.`);
                return;
            }

            res.status(200).send(await DatabaseHelper.addNomination(userId, bsrId, category));
        });
    }
}