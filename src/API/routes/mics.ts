import { Express } from 'express';
import { DatabaseHelper, NominationCount } from '../../Shared/Database';

export class MiscRoutes {
    private app: Express;
    private submissionCountCache: NominationCount;

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
        setInterval(() => {
            this.getCount();
        }, 60000);
    }

    private async loadRoutes() {
        this.app.get(`/api/count`, async (req, res) => {
            res.status(200).send(this.submissionCountCache);
        });
    }

    private async getCount() {
        this.submissionCountCache = await DatabaseHelper.getNominationCount();
    }
}