import { Express } from 'express';
import { DatabaseHelper, NominationCount } from '../../Shared/Database';
import path from 'node:path';

export class MiscRoutes {
    private app: Express;
    private submissionCountCache: NominationCount[];

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
        setTimeout(() => {
            this.getCount();
        }, 5000);
        setInterval(() => {
            this.getCount();
        }, 60000);
    }

    private async getCount() {
        this.submissionCountCache = await DatabaseHelper.getNominationCount();
    }

    private async loadRoutes() {
        this.app.get(`/api/counts`, async (req, res) => {
            res.status(200).send(this.submissionCountCache);
        });

        // #region CDN
        this.app.get(`/cdn/loginbl.png`, (req, res) => {
            res.sendFile(path.resolve(`assets/loginbl.png`));
        });

        this.app.get(`/cdn/loginbltrans.png`, (req, res) => {
            res.sendFile(path.resolve(`assets/loginbltrans220.png`));
        });

        this.app.get(`/cdn/loginbs.png`, (req, res) => {
            res.sendFile(path.resolve(`assets/loginbs.png`));
        });

        this.app.get(`/cdn/char/standard.svg`, (req, res) => {
            res.sendFile(path.resolve(`assets/standard.svg`));
        });

        this.app.get(`/cdn/char/one-saber.svg`, (req, res) => {
            res.sendFile(path.resolve(`assets/one-saber.svg`));
        });

        this.app.get(`/cdn/char/no-arrows.svg`, (req, res) => {
            res.sendFile(path.resolve(`assets/no-arrows.svg`));
        });

        this.app.get(`/cdn/char/lightshow.svg`, (req, res) => {
            res.sendFile(path.resolve(`assets/lightshow.svg`));
        });

        this.app.get(`/cdn/char/360-degree.svg`, (req, res) => {
            res.sendFile(path.resolve(`assets/360-degree.svg`));
        });

        this.app.get(`/cdn/char/90-degree.svg`, (req, res) => {
            res.sendFile(path.resolve(`assets/90-degree.svg`));
        });

        this.app.get(`/cdn/char/lawless.svg`, (req, res) => {
            res.sendFile(path.resolve(`assets/lawless.svg`));
        });

        this.app.get(`/cdn/char/legacy.svg`, (req, res) => {
            res.sendFile(path.resolve(`assets/legacy.svg`));
        });

        this.app.get(`/favicon.png`, (req, res) => {
            res.sendFile(path.resolve(`assets/favicon.png`));
        });

        // #endregion
    
        // #region HTML
        this.app.get(`/`, (req, res) => {
            res.sendFile(path.resolve(`assets/index.html`));
        });
        
        this.app.get(`/success`, (req, res) => {
            res.sendFile(path.resolve(`assets/success.html`));
        });

        this.app.get(`/judging/sort`, (req, res) => {
            res.sendFile(path.resolve(`assets/judging/sort.html`));
        });

        this.app.get(`/judging/style.css`, (req, res) => {
            res.sendFile(path.resolve(`assets/judging/style.css`));
        });
    }

   
}