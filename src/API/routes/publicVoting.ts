import express, { Express } from 'express';
import * as fs from 'fs';
import path from 'path';
import { DatabaseHelper, SortedSubmissionsCategory, validateEnumValue } from '../../Shared/Database';
import rateLimit from 'express-rate-limit';

export class PublicVotingRoutes {
    private app: Express;
    private validStates: string[] = [];

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        this.app.get(`/finalists`, (req, res) => {
            res.setHeader(`Cache-Control`, `public, max-age=1800`);
            res.sendFile(path.resolve(`./assets/finalists.html`));
        });

        this.app.get(`/api/voting/maps`, async (req, res) => {
            let maps = JSON.parse(fs.readFileSync(path.resolve(`./storage/finalistConfig.json`)).toString());
            res.setHeader(`Content-Type`, `application/json`);
            res.setHeader(`Cache-Control`, `public, max-age=1800, immutable`);
            res.status(200).send(maps);
        });

        this.app.use(`/cdn/mapIcons`, express.static(path.resolve(`./storage/images`), {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            extensions: [`png`, `jpg`, `jpeg`, `gif`, `webp`],
            immutable: true,
            fallthrough: true,
            dotfiles: `ignore`,
            etag: true,
            index: false
        }));

        this.app.get(`/api/voting/votes`, async (req, res) => {
            let sessionId = req.session.userId;
            if (!sessionId) {
                res.status(401).send({ message: `Unauthorized.` });
                return;
            }

            let votes = await DatabaseHelper.database.publicVotes.findAll({
                where: {
                    userId: sessionId,
                    service: req.session.service
                }
            }).catch((err) => {
                console.error(err);
                return res.status(500).send({ message: `Failed to fetch votes.` });
            });

            res.status(200).send(votes);
        });

        this.app.post(`/api/voting/vote`, rateLimit({
            windowMs: 60 * 1000,
            max: 30,
            message: { message: `You've been rate limited. Please try again later.\n\nレート制限を超えました。しばらくしてからもう一度お試しください。`},
            statusCode: 429,
            skipSuccessfulRequests: false
        }), async (req, res) => {
            let sessionId = req.session.userId;
            let sessionService = req.session.service;
            let id = req.body.id;
            let category = req.body.category;

            if (new Date(Date.now()) >= new Date(`January 15, 2025 00:00:00 UTC`)) {
                res.status(400).send({ message: `Voting is now closed. Thank you for participating!\n\n投票は終了いたしました。ご参加ありがとうございました！` });
                return;
            }

            if (!sessionId) {
                res.status(401).send({ message: `You need to be logged in to submit a nomination.\n\n推薦するにはログインしてください。` });
                return;
            }

            if (!category || typeof category !== `string` || validateEnumValue(category, SortedSubmissionsCategory) === false) {
                res.status(400).send({ message: `Missing category.\n\n最低でも１つの項目に間違いがあります。` });
                return;
            }

            if (id !== null && typeof id !== `string`) {
                res.status(400).send({ message: `Invalid parameters.\n\n最低でも１つの項目に間違いがあります。` });
                return;
            }

            let existingVote = await DatabaseHelper.database.publicVotes.findOne({
                where: {
                    userId: sessionId,
                    service: sessionService,
                    category: category
                }
            });

            if (existingVote) {
                existingVote.voteRecord = id;
                await existingVote.save().catch((err) => {
                    console.error(err);
                    return res.status(500).send({ message: `Failed to save vote.` });
                });
            } else {
                await DatabaseHelper.database.publicVotes.create({
                    userId: sessionId,
                    service: sessionService,
                    voteRecord: id,
                    category: category as SortedSubmissionsCategory,
                    linkedId: req.session.beatSaverId
                });
            }

            console.log(`Vote saved for ${sessionId} in category ${category} with id ${id}.`);
            res.status(200).send({ message: `Vote saved!`, vote: existingVote });
        });
    }
}