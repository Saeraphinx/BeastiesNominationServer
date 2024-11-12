/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Express } from 'express';
import { DatabaseHelper, SortedSubmissionsCategory } from '../../Shared/Database';
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
                    if (!bsrAlreadyDone.includes(entry.bsrId) && entry.bsrId !== null && entry.bsrId !== ``) {
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

        this.app.get(`/api/admin/repopulateSortedSubmissions`, async (req, res) => {
            if (!req.session.userId && req.session.service !== `judgeId`) {
                return res.status(401).send({ error: `Not logged in.` });
            }

            let user = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!user || !user.roles.includes(`admin`)) {
                return res.status(403).send({ error: `Not authorized.` });
            }

            let category = req.query.category as string;

            if (!category) {
                return res.status(400).send({ error: `Missing category.` });
            }

            let allSortedSubmissions = await DatabaseHelper.database.sortedSubmissions.findAll({ where: { category: category }});
            let categoryAcceptedSubmissions = await DatabaseHelper.database.nominations.findAll({ where: { filterStatus: `Accepted`, category: category } });

            console.log(`Found ${allSortedSubmissions.length} sorted submissions and ${categoryAcceptedSubmissions.length} accepted submissions.`);

            for (let aS of categoryAcceptedSubmissions) {
                let alreadySorted = allSortedSubmissions.find((sS) => {
                    if (category == sS.category) {
                        if (DatabaseHelper.isDiffCharRequired(category)) {
                            if (sS.characteristic == aS.characteristic && sS.difficulty == aS.difficulty && sS.bsrId == aS.bsrId) {
                                console.log(`Found ${aS.bsrId} in ${category} ${aS.characteristic} ${aS.difficulty}`);
                                return true;
                            }
                        } else if (category == `Gen-FullSpread`) {
                            if (sS.bsrId == aS.bsrId) {
                                console.log(`Found ${aS.bsrId} in ${category}`);
                                return true;
                            }
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                });

                if (!alreadySorted) {
                    if (DatabaseHelper.isDiffCharRequired(category)) {
                        let hashAndMappers = await getMapperAndHash(aS.bsrId);
                        if (!hashAndMappers) {
                            Logger.warn(`Failed to fetch data for ${aS.bsrId}, map is likely deleted.`);
                            continue;
                        }

                        let newSorted = await DatabaseHelper.database.sortedSubmissions.create({
                            bsrId: aS.bsrId,
                            category: category as SortedSubmissionsCategory,
                            characteristic: aS.characteristic,
                            difficulty: aS.difficulty,
                            hash: hashAndMappers.hash,
                            involvedMappers: hashAndMappers.involvedMappers
                        });
                        if (!newSorted) {
                            Logger.warn(`Failed to create new sorted submission for ${aS.bsrId} in ${category} ${aS.characteristic} ${aS.difficulty}`);
                        }
                        Logger.log(`Created new sorted submission for ${aS.bsrId} in ${category} ${aS.characteristic} ${aS.difficulty}`);
                    } else if (category == `Gen-FullSpread`) {
                        let hashAndMappers = await getMapperAndHash(aS.bsrId);
                        if (!hashAndMappers) {
                            Logger.warn(`Failed to fetch data for ${aS.bsrId}, map is likely deleted.`);
                            continue;
                        }

                        let newSorted = await DatabaseHelper.database.sortedSubmissions.create({
                            bsrId: aS.bsrId,
                            category: category as SortedSubmissionsCategory,
                            characteristic: null,
                            difficulty: null,
                            hash: hashAndMappers.hash,
                            involvedMappers: hashAndMappers.involvedMappers
                        });
                        if (!newSorted) {
                            Logger.warn(`Failed to create new sorted submission for ${aS.bsrId} in ${category}`);
                        }
                        Logger.log(`Created new sorted submission for ${aS.bsrId} in ${category}`);
                    }
                }
            }
            res.send({ message: `Repopulated sorted submissions for ${category}` });
        });
    }
}

async function getMapperAndHash(bsrId: string): Promise<{ hash: string, involvedMappers: string[] }|null> {
    let involvedMappers: any[] = [];
    let hash = null;
    let parsedBSR = parseInt(bsrId, 16);
    if (isNaN(parsedBSR)) {
        return null;
    }
    await fetch(`https://api.beatsaver.com/maps/id/${parsedBSR.toString(16)}`).then(async (response): Promise<void> => {
        if (response.status !== 200) {
            return null;
        }

        let json = await response.json() as any;
        hash = json.versions[0].hash;
        involvedMappers.push(json.uploader.id as string);
        if (json.collaborators) {
            json.collaborators.forEach((collab: any) => {
                involvedMappers.push(collab.id as string);
            });
        }
    });
    return { hash, involvedMappers };
}