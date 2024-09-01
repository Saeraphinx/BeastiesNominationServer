import { Express, NextFunction, RequestHandler } from 'express';
import { DatabaseHelper, NominationCount } from '../../Shared/Database';
import path from 'node:path';

export class MiscRoutes {
    private app: Express;
    private submissionCountCache: NominationCount[];
    private readonly cacheControl: string = `public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=86400`;

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
        setTimeout(() => {
            this.getCount();
        }, 20000);
        setInterval(() => {
            this.getCount();
        }, 60000);
    }

    private async getCount() {
        this.submissionCountCache = await DatabaseHelper.getNominationCount();
    }

    private setCache(req: any, res: any, next: NextFunction) {
        // Cache for 1 hour
        res.setHeader(`Cache-Control`, this.cacheControl);
        next();
    }

    private async loadRoutes() {
        this.app.get(`/api/counts`, async (req, res) => {
            res.setHeader(`Cache-Control`, `public, max-age=60, s-maxage=60, stale-while-revalidate=86400, stale-if-error=86400`);
            res.status(200).send(this.submissionCountCache);
        });

        // #region CDN
        this.app.get(`/cdn/loginbl.png`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/loginbl.png`));
        });

        this.app.get(`/cdn/loginbltrans.png`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/loginbltrans220.png`));
        });

        this.app.get(`/cdn/loginbs.png`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/loginbs.png`));
        });

        this.app.get(`/cdn/char/standard.svg`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/standard.svg`));
        });

        this.app.get(`/cdn/char/one-saber.svg`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/one-saber.svg`));
        });

        this.app.get(`/cdn/char/no-arrows.svg`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/no-arrows.svg`));
        });

        this.app.get(`/cdn/char/lightshow.svg`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/lightshow.svg`));
        });

        this.app.get(`/cdn/char/360-degree.svg`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/360-degree.svg`));
        });

        this.app.get(`/cdn/char/90-degree.svg`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/90-degree.svg`));
        });

        this.app.get(`/cdn/char/lawless.svg`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/lawless.svg`));
        });

        this.app.get(`/cdn/char/legacy.svg`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/legacy.svg`));
        });

        this.app.get(`/favicon.png`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/favicon.png`));
        });

        // #endregion
    
        // #region HTML
        this.app.get(`/`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/index.html`));
        });
        
        this.app.get(`/success`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/success.html`));
        });

        this.app.get(`/judging/sort`, async (req, res) => {
            if (!req.session.id || req.session.service !== `judgeId`) {
                return res.status(401).send(this.redirectTo(`/judging`));
            }

            const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!judge.roles.includes(`sort`)) {
                return res.status(403).send(this.redirectTo(`/judging`));
            }
            res.sendFile(path.resolve(`assets/judging/sort.html`));
        });

        this.app.get(`/judging`, this.setCache, (req, res) => {
            res.sendFile(path.resolve(`assets/judging/index.html`));
        });

        this.app.get(`/judging/style.css`, this.setCache, async (req, res) => {
            res.sendFile(path.resolve(`assets/judging/style.css`));
        });
    }

    private redirectTo(url: string) {
        return `<head><meta http-equiv="refresh" content="0; url=${url}" /></head><body><a href="${url}">Click here if you are not redirected...</a></body>`;
    }
}