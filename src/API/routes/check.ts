import { Express } from 'express';
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

            if (!userId || !bsrId || !category) {
                res.status(400).send(`Invalid request.`);
                return;
            }

            if (this.recentSubmissions.filter(id => id == bsrId).length > 3) {
                res.status(429).send(`Rate Limited.`);
                return;
            }

            await DatabaseHelper.addNomination(userId, bsrId, category);
            res.status(200).send({ message : `Nomination submitted.` });
        });
    }
}