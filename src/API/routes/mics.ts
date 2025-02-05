import express, { Express, NextFunction, RequestHandler } from 'express';
import { DatabaseHelper, NominationCount, SortedSubmissionsCategory, SortedSubmissionsCategoryEnglish, validateEnumValue } from '../../Shared/Database';
import path from 'node:path';
import fs from 'node:fs';

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
        //this.submissionCountCache = await DatabaseHelper.getNominationCount();
    }

    private async loadRoutes() {
        this.app.get(`/api/counts`, async (req, res) => {
            res.setHeader(`Cache-Control`, `public, max-age=60, s-maxage=60, stale-while-revalidate=86400, stale-if-error=86400`);
            res.status(200).send(this.submissionCountCache);
        });

        // #region CDN
        this.app.get(`/cdn/loginbl.png`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/loginbl.png`));
        });

        this.app.get(`/cdn/loginbltrans.png`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/loginbltrans220.png`));
        });

        this.app.get(`/cdn/loginbs.png`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/loginbs.png`));
        });

        this.app.get(`/cdn/char/standard.svg`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/standard.svg`));
        });

        this.app.get(`/cdn/char/one-saber.svg`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/one-saber.svg`));
        });

        this.app.get(`/cdn/char/no-arrows.svg`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/no-arrows.svg`));
        });

        this.app.get(`/cdn/char/lightshow.svg`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/lightshow.svg`));
        });

        this.app.get(`/cdn/char/360-degree.svg`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/360-degree.svg`));
        });

        this.app.get(`/cdn/char/90-degree.svg`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/90-degree.svg`));
        });

        this.app.get(`/cdn/char/lawless.svg`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/lawless.svg`));
        });

        this.app.get(`/cdn/char/legacy.svg`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/legacy.svg`));
        });

        this.app.get(`/favicon.png`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/favicon.png`));
        });

        this.app.get(`/favicon.ico`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/favicon.png`));
        });

        this.app.get(`/cdn/beastsaber.jpg`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/beastsaber.jpg`));
        });

        this.app.get(`/cdn/Forest.png`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/bg/Forest.png`));
        });

        this.app.get(`/cdn/Lily.png`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/bg/Lily's Outlook.png`));
        });

        this.app.get(`/cdn/MadelineAndTheo.png`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/bg/Madeline and Theo.png`));
        });

        this.app.get(`/cdn/XI.png`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/bg/XI's Shadow.png`));
        });
        // #endregion
    
        // #region HTML
        this.app.get(`/`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            //res.sendFile(path.resolve(`assets/index.html`));
            res.redirect(`/finalists`);
        });

        this.app.get(`/render`, (req, res) => {
            if (!req.session.id || req.session.service !== `judgeId`) {
                return res.status(401).send(this.redirectTo(`/judging`));
            }
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/finalists-render.html`));
        });

        this.app.get(`/renderscript.js`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/dom-to-image.min.js`));
        });

        this.app.get(`/jp`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/index-jp.html`));
        });
        
        this.app.get(`/success`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
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

        this.app.get(`/judging/judge`, async (req, res) => {
            if (!req.session.id || req.session.service !== `judgeId`) {
                return res.status(401).send(this.redirectTo(`/judging`));
            }

            const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!judge?.roles?.includes(`judge`)) {
                return res.status(403).send(this.redirectTo(`/judging`));
            }

            res.sendFile(path.resolve(`assets/judging/judge.html`));
        });

        this.app.get(`/judging/judge/voteScript.js`, async (req, res) => {
            if (!req.session.id || req.session.service !== `judgeId`) {
                return res.status(401).send(this.redirectTo(`/judging`));
            }

            const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!judge?.roles?.includes(`judge`)) {
                return res.status(403).send(this.redirectTo(`/judging`));
            }

            res.sendFile(path.resolve(`assets/judging/voteScript.js`));
        });

        this.app.get(`/judging/judge/:category`, async (req, res) => {
            if (!req.session.id || req.session.service !== `judgeId`) {
                return res.status(401).send(this.redirectTo(`/judging`));
            }

            const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!judge.roles.includes(`judge`)) {
                return res.status(403).send(this.redirectTo(`/judging`));
            }
            
            const { category } = req.params;

            if (!category || typeof category !== `string`) {
                return res.status(400).send(this.redirectTo(`/judging`));
            }

            if (!validateEnumValue(category, SortedSubmissionsCategory) || !judge.permittedCategories.includes(category as SortedSubmissionsCategory)) {
                return res.status(403).send(this.redirectTo(`/judging`));
            }

            let response = fs.readFileSync(path.resolve(`assets/judging/judgeMapTemplate.html`), `utf8`);

            let allCategories = Object.values(SortedSubmissionsCategoryEnglish);
            response = response.replaceAll(`{{CATEGORY_FREN_NAME}}`, allCategories.find(c => c[0] == category)[1]); //fuck it wii ball
            response = response.replaceAll(`{{CATEGORY_PROG_NAME}}`, allCategories.find(c => c[0] == category)[0]);

            res.send(response);
        });

        this.app.get(`/judging`, (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/judging/index.html`));
        });

        this.app.get(`/judging/admin`, async (req, res) => {
            if (!req.session.id || req.session.service !== `judgeId`) {
                return res.status(401).send(this.redirectTo(`/judging`));
            }

            const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!judge.roles.includes(`admin`)) {
                return res.status(403).send(this.redirectTo(`/judging`));
            }

            console.log(`Admin Panel access by ${req.ip}`);
            res.sendFile(path.resolve(`assets/judging/admin.html`));
        });

        this.app.get(`/judging/admin/script.js`, async (req, res) => {
            if (!req.session.id || req.session.service !== `judgeId`) {
                return res.status(401).send(this.redirectTo(`/judging`));
            }

            const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!judge.roles.includes(`admin`)) {
                return res.status(403).send(this.redirectTo(`/judging`));
            }

            res.sendFile(path.resolve(`assets/judging/adminScript.js`));
        });

        this.app.get(`/judging/style.css`, async (req, res) => {
            res.setHeader(`Cache-Control`, this.cacheControl);
            res.sendFile(path.resolve(`assets/judging/style.css`));
        });

        this.app.get(`/judging/background.js`, async (req, res) => {
            res.sendFile(path.resolve(`assets/judging/background.js`));
        });

        this.app.use(`/cdn/icons`, express.static(path.resolve(`assets/icons`), {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            extensions: [`svg`],
            immutable: true,
            fallthrough: true,
            dotfiles: `ignore`,
            etag: true,
            index: false
        }));
    }

    private redirectTo(url: string) {
        return `<head><meta http-equiv="refresh" content="0; url=${url}" /></head><body><a href="${url}">Click here if you are not redirected...</a></body>`;
    }
}