/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Express } from 'express';
import { BeatLeaderAuthHelper, BeatSaverAuthHelper, DiscordAuthHelper } from '../classes/AuthHelper';
import { HTTPTools } from '../classes/HTTPTools';
import { server } from '../../../storage/config.json';
import { DatabaseHelper } from '../../Shared/Database';
import { Logger } from '../../Shared/Logger';

export class AdminRoutes {
    private app: Express;
    private validStates: string[] = [];

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        this.app.get(`/api/admin/updateNullValues`, async (req, res) => {
            if (!req.session.userId && req.session.service !== `judgeId`) {
                return res.status(401).send({ error: `Not logged in.` });
            }

            let user = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!user || !user.roles.includes(`admin`)) {
                return res.status(403).send({ error: `Not authorized.` });
            }

            let bsrAlreadyDone: string[] = [];
            let i = 0;
            let allEntries = await DatabaseHelper.database.sortedSubmissions.findAll({ where: { hash: null } });
            for (let entry of allEntries) {
                i++;
                setTimeout(async () => {
                    if (!bsrAlreadyDone.includes(entry.bsrId) && entry.bsrId !== null && entry.bsrId !== "") {
                        let response = await fetch(`https://api.beatsaver.com/maps/id/${entry.bsrId}`);
                        if (response.ok) {
                            let data = await response.json() as any;
                            let apiHash = data.versions[0].hash;
                            let involvedMappers: string[] = [];
                            involvedMappers.push(data.uploader.id as string);
                            if (data.collaborators) {
                                data.collaborators.forEach((collab: any) => {
                                    involvedMappers.push(collab.id as string);
                                });
                            }
                            let changes = await DatabaseHelper.database.sortedSubmissions.update({ hash: apiHash, involvedMappers: involvedMappers }, { where: { bsrId: entry.bsrId } });
                            Logger.log(`${changes} updates - Updating ${entry.bsrId} with hash ${apiHash} and mappers ${involvedMappers.join(`, `)}`);
                        } else {
                            Logger.error(`Failed to fetch data for ${entry.bsrId}`);
                        }
                        bsrAlreadyDone.push(entry.bsrId);
                    } else {
                        Logger.log(`Skipping ${entry.bsrId} as it already has a hash.`);
                        bsrAlreadyDone.push(entry.bsrId);
                    }
                }, i * 750);
            }
            return res.status(200).send({ message: `Started updating null hashes.` });
        });

        this.app.get(`/api/admin/runInvolvedCheck`, async (req, res) => {
            if (!req.session.userId && req.session.service !== `judgeId`) {
                return res.status(401).send({ error: `Not logged in.` });
            }

            let user = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!user || !user.roles.includes(`admin`)) {
                return res.status(403).send({ error: `Not authorized.` });
            }

            res.status(200).send({ message: `Started running involved check.` });
            let allEntries = await DatabaseHelper.database.sortedSubmissions.findAll();
            let allJudges = await DatabaseHelper.database.judges.findAll();
            for (let judge of allJudges) {
                Logger.log(`Checking ${judge.name}`);
                for (let mapperId of judge.beatSaverIds) {
                    for (let entry of allEntries) {
                        if (entry.involvedMappers && entry.involvedMappers.length > 0) {
                            // @ts-ignore honestly uh fuck
                            if (entry.involvedMappers.includes(parseInt(mapperId))) {
                                Logger.log(`Found ${mapperId} in id ${entry.id}`);
                                let existingVote = await DatabaseHelper.database.judgeVotes.findOne({ where: { submissionId: entry.id, judgeId: judge.id } });

                                if (!existingVote) {
                                    Logger.log(`Creating vote for ${entry.hash} by ${mapperId} for ${judge.name}`);
                                    await DatabaseHelper.database.judgeVotes.create({
                                        submissionId: entry.id,
                                        judgeId: judge.id,
                                        score: 0.5,
                                        notes: `Automatically created by BNS.`
                                    });
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}

