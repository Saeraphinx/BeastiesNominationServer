/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Express } from 'express';
import { DatabaseHelper, Judge, JudgeVote, SortedSubmission, SortedSubmissionsCategory, validateEnumValue } from '../../Shared/Database';
import { Logger } from '../../Shared/Logger';
import { ModelStatic } from 'sequelize';

export class AdminRoutes {
    private app: Express;
    private validStates: string[] = [];

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        // #region One Shot
        this.app.post(`/api/admin/updateNullValues`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

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

        this.app.post(`/api/admin/runInvolvedCheck`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            res.status(200).send({ message: `Started running involved check.` });
            let voteCount = 0;
            let detectedCount = 0;
            let allEntries = await DatabaseHelper.database.sortedSubmissions.findAll();
            let allJudges = await DatabaseHelper.database.judges.findAll();
            for (let judge of allJudges) {
                Logger.log(`Checking ${judge.name}`);
                for (let mapperId of judge.beatSaverIds) {
                    for (let entry of allEntries) {
                        if (entry.involvedMappers && entry.involvedMappers.length > 0) {
                            // @ts-ignore honestly uh fuck
                            if (entry.involvedMappers.includes(parseInt(mapperId))) {
                                console.log(`Found ${mapperId} in id ${entry.id}`);
                                detectedCount++;
                                let existingVote = await DatabaseHelper.database.judgeVotes.findOne({ where: { submissionId: entry.id, judgeId: judge.id } });

                                if (!existingVote) {
                                    console.log(`Creating vote for ${entry.hash} by ${mapperId} for ${judge.name}`);
                                    voteCount++;
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
            Logger.log(`Finished running involved check. - ${detectedCount} involved votes detected, ${voteCount} votes created.`);
        });

        this.app.get(`/api/admin/database/integrityCheck`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            DatabaseHelper.database.sequelize.query(`PRAGMA integrity_check;`).then((healthcheck) => {
                let healthcheckString = (healthcheck[0][0] as any).integrity_check;
                Logger.log(`Manual - Database health check: ${healthcheckString}`);
                res.send({ message: `Database health check: ${healthcheckString}` });
            }).catch((error) => {
                Logger.error(`Manual - Error checking database health: ${error}`);
                res.send({ message: `Database health check: ${error}` });
            });

        });
        // #endregion One Shot
        // #region Per Category
        this.app.post(`/api/admin/repopulateSortedSubmissions`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            let category = req.body.category as string;

            if (!category) {
                return res.status(400).send({ error: `Missing category.` });
            }

            let allSortedSubmissions = await DatabaseHelper.database.sortedSubmissions.findAll({ where: { category: category } });
            let categoryAcceptedSubmissions = await DatabaseHelper.database.nominations.findAll({ where: { filterStatus: `Accepted`, category: category } });

            Logger.log(`Found ${allSortedSubmissions.length} sorted submissions and ${categoryAcceptedSubmissions.length} accepted submissions.`);

            let count = 0;
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
                        console.log(`Created new sorted submission for ${aS.bsrId} in ${category} ${aS.characteristic} ${aS.difficulty}`);
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
                        count++;
                        console.log(`Created new sorted submission for ${aS.bsrId} in ${category}`);
                    }
                }
            }
            Logger.log(`Repopulated ${count} sorted submissions for ${category}`);
            res.send({ message: `Repopulated sorted submissions for ${category}` });
        });

        // #endregion Per Category
        // #region Database
        this.app.get(`/api/admin/database/data/:table`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            let table = req.params.table;

            if (!table) {
                return res.status(400).send({ message: `Missing table or id.` });
            }

            let bsr = req.query.bsr as string;

            let results;
            switch (table) {
                case `sortedSubmissions`:
                    if (!bsr) {
                        if (user.id == 1) {
                            results = await DatabaseHelper.database.sortedSubmissions.findAll();
                        } else {
                            return res.status(403).send({ message: `Not authorized.` });
                        }
                    } else {
                        results = await DatabaseHelper.database.sortedSubmissions.findOne({ where: { bsrId: bsr } });
                    }
                    break;
                case `submissions`:
                    if (!bsr) {
                        if (user.id == 1) {
                            results = await DatabaseHelper.database.nominations.findAll();
                        } else {
                            return res.status(403).send({ message: `Not authorized.` });
                        }
                    } else {
                        results = await DatabaseHelper.database.nominations.findOne({ where: { bsrId: bsr } });
                    }
                    break;
                case `judges`:
                    let username = req.query.username as string;
                    results = await DatabaseHelper.database.judges.findOne({ where: { name: username } });
                    break;
                default:
                    return res.status(400).send({ message: `Invalid table.` });
            }

            if (!results) {
                return res.status(404).send({ message: `Data not found.` });
            }

            res.send(results);
        });
        
        this.app.get(`/api/admin/database/data/:table/:id`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            let table = req.params.table;
            let id = req.params.id;

            if (!table || !id) {
                return res.status(400).send({ message: `Missing table or id.` });
            }

            let results;
            switch (table) {
                case `sortedSubmissions`:
                    results = await DatabaseHelper.database.sortedSubmissions.findOne({ where: { id: id } });
                    break;
                case `submissions`:
                    results = await DatabaseHelper.database.nominations.findOne({ where: { nominationId: id } });
                    break;
                case `judges`:
                    results = await DatabaseHelper.database.judges.findOne({ where: { id: id } });
                    break;
                case `judgeVotes`:
                    if (user.id == 1) {
                        results = await DatabaseHelper.database.judgeVotes.findOne({ where: { id: id } });
                    } else {
                        return res.status(403).send({ message: `Not authorized.` });
                    }
                    break;
                default:
                    return res.status(400).send({ message: `Invalid table.` });
            }

            if (!results) {
                return res.status(404).send({ message: `Data not found.` });
            }

            res.send(results);
        });

        this.app.delete(`/api/admin/database/data/:table/:id`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            let table = req.params.table;
            let id = req.params.id;

            if (!table || !id) {
                return res.status(400).send({ message: `Missing table or id.` });
            }

            let results;
            switch (table) {
                case `sortedSubmissions`:
                    results = await DatabaseHelper.database.sortedSubmissions.findOne({ where: { id: id } });
                    break;
                case `submissions`:
                    results = await DatabaseHelper.database.nominations.findOne({ where: { nominationId: id } });
                    break;
                case `judges`:
                    results = await DatabaseHelper.database.judges.findOne({ where: { id: id } });
                    break;
                case `judgeVotes`:
                    if (user.id == 1) {
                        results = await DatabaseHelper.database.judgeVotes.findOne({ where: { id: id } });
                    } else {
                        return res.status(403).send({ message: `Not authorized.` });
                    }
                    break;
                default:
                    return res.status(400).send({ message: `Invalid table.` });
            }

            if (!results) {
                return res.status(404).send({ message: `Data not found.` });
            }

            let record = results.toJSON() as any;
            await results.destroy();
            Logger.log(`Deleted record ${record.id} from ${table} - ${JSON.stringify(record)}`, `Admin`);
            res.send({ message: `Deleted record ${record.id} from ${table}`, record });
        });
        // #endregion Database

        // #region Judges
        this.app.post(`/api/admin/judges/:id/addCategory`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            let category = req.body.category;
            let id = req.params.id;

            if (!category || typeof category !== `string` || !validateEnumValue(category, SortedSubmissionsCategory)) {
                return res.status(400).send({ message: `Missing category.` });
            }

            if (!id || typeof id !== `string` || isNaN(parseInt(id))) {
                return res.status(400).send({ message: `Missing id.` });
            }

            let judge = await DatabaseHelper.database.judges.findOne({ where: { id: id } });

            if (!judge) {
                return res.status(404).send({ message: `Judge not found.` });
            }

            let conCategory = category as SortedSubmissionsCategory;

            if (judge.permittedCategories.includes(conCategory)) {
                return res.status(400).send({ message: `Judge already has that category.` });
            }

            judge.permittedCategories = [...judge.permittedCategories, conCategory];
            await judge.save();

            Logger.log(`Added category ${category} to judge ${judge.name}`, `Admin`);
            res.send({ message: `Added category ${category} to judge ${judge.name}` });
        });

        this.app.post(`/api/admin/judges/:id/removeCategory`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            let category = req.body.category;
            let id = req.params.id;

            if (!category || typeof category !== `string` || !validateEnumValue(category, SortedSubmissionsCategory)) {
                return res.status(400).send({ message: `Missing category.` });
            }

            if (!id || typeof id !== `string` || isNaN(parseInt(id))) {
                return res.status(400).send({ message: `Missing id.` });
            }

            let judge = await DatabaseHelper.database.judges.findOne({ where: { id: id } });

            if (!judge) {
                return res.status(404).send({ message: `Judge not found.` });
            }

            if (!judge.permittedCategories.includes(category as SortedSubmissionsCategory)) {
                return res.status(400).send({ message: `Judge does not have that category.` });
            }

            judge.permittedCategories = judge.permittedCategories.filter((c) => c !== category);
            await judge.save();

            Logger.log(`Removed category ${category} from judge ${judge.name}`, `Admin`);
            res.send({ message: `Removed category ${category} from judge ${judge.name}` });
        });

        this.app.post(`/api/admin/judges/:id/addRole`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            let id = req.params.id;
            let { role } = req.body;

            if (!id || typeof id !== `string` || isNaN(parseInt(id))) {
                return res.status(400).send({ message: `Missing id.` });
            }

            if (!role || typeof role !== `string`) {
                return res.status(400).send({ message: `Missing role.` });
            }

            let judge = await DatabaseHelper.database.judges.findOne({ where: { id: id } });

            if (!judge) {
                return res.status(400).send({ message: `Judge doesn't exist.` });
            }

            switch (role) {
                case `judge`:
                    if (judge.roles.includes(`judge`)) {
                        return res.status(400).send({ message: `Judge already has that role.` });
                    }
                    judge.roles = [...judge.roles, `judge`];
                    break;
                case `sort`:
                    if (judge.roles.includes(`sort`)) {
                        return res.status(400).send({ message: `Judge already has that role.` });
                    }
                    judge.roles = [...judge.roles, `sort`];
                    break;
                default:
                    return res.status(400).send({ message: `Invalid role.` });
            }
            await judge.save();
            Logger.log(`Added ${role} role to ${judge.name}`, `Admin`);
            res.send({ message: `Added ${role} role to ${judge.name}` });
        });

        this.app.post(`/api/admin/judges/:id/removeRole`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            let id = req.params.id;
            let { role } = req.body;

            if (!id || typeof id !== `string` || isNaN(parseInt(id))) {
                return res.status(400).send({ message: `Missing id.` });
            }

            if (!role || typeof role !== `string`) {
                return res.status(400).send({ message: `Missing role.` });
            }

            let judge = await DatabaseHelper.database.judges.findOne({ where: { id: id } });

            if (!judge) {
                return res.status(400).send({ message: `Judge doesn't exist.` });
            }

            switch (role) {
                case `judge`:
                    if (!judge.roles.includes(`judge`)) {
                        return res.status(400).send({ message: `Judge doesn't have that role.` });
                    }
                    judge.roles = judge.roles.filter((r) => r !== `judge`);
                    break;
                case `sort`:
                    if (!judge.roles.includes(`sort`)) {
                        return res.status(400).send({ message: `Judge doesn't have that role.` });
                    }
                    judge.roles = judge.roles.filter((r) => r !== `sort`);
                    break;
                default:
                    return res.status(400).send({ message: `Invalid role.` });
            }
            await judge.save();
            Logger.log(`Removed ${role} role from ${judge.name}`, `Admin`);
            res.send({ message: `Removed ${role} role from ${judge.name}` });
        });

        this.app.get(`/api/admin/judges/:id/percentdone`, async (req, res) => {
            let id = req.params.id;

            if (!id || typeof id !== `string` || isNaN(parseInt(id))) {
                return res.status(400).send({ message: `Missing id.` });
            }

            let user = await isAuthroizedSession(req, res, parseInt(id));
            if (!user) { return; }

            let judge = await DatabaseHelper.database.judges.findOne({ where: { id: id } });

            if (!judge) {
                return res.status(404).send({ message: `Judge not found.` });
            }

            Logger.log(`Getting precentage done for ${judge.name} (Req by ${user.name})`, `Admin`);

            let votes = await DatabaseHelper.database.judgeVotes.findAll({ where: { judgeId: id } });
            let submissions = await DatabaseHelper.database.sortedSubmissions.findAll();

            let totalVotes = 0;
            let totalAssigned = 0;
            let response: { category: string, totalSubmissions: number, judgeVotes: number, precentage: number }[] = [];
            for (let category of judge.permittedCategories) {
                let categorySubmissions = submissions.filter((s) => s.category == category);
                totalAssigned += categorySubmissions.length;
                let categoryVotes = votes.filter((v) => categorySubmissions.find((s) => s.id == v.submissionId && v.score !== -1));
                totalVotes += categoryVotes.length;
                response.push({
                    category: category,
                    totalSubmissions: categorySubmissions.length,
                    judgeVotes: categoryVotes.length,
                    precentage: (categoryVotes.length / categorySubmissions.length) * 100
                });
            }

            res.send({ totalVotes, totalAssigned, precentage: (totalVotes / totalAssigned) * 100, response });
        });
        // #endregion Judges

        // #region Voting
        this.app.delete(`/api/admin/cutSubmissions`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            let category = req.body.category as string;
            let amount = parseInt(req.body.amount);
            let noThreshold = parseInt(req.body.noThreshold);
            let fakeRun = req.body.fakeRun as boolean;

            if (!category) {
                return res.status(400).send({ error: `Missing category.` });
            }

            if (!validateEnumValue(category, SortedSubmissionsCategory)) {
                return res.status(400).send({ error: `Invalid category.` });
            }

            Logger.log(`${user.name} has initiated cutting submissions for ${category}`, `Admin`);
            let submissions = await DatabaseHelper.database.sortedSubmissions.findAll({ where: { category: category } });
            let votes = await DatabaseHelper.database.judgeVotes.findAll();
            let count = 0;
            let cutMaps: {submission: SortedSubmission, voteScore?: number, noCount?:number}[] = [];

            if (!noThreshold || isNaN(noThreshold)) {// preform amount cut
                submissions.sort((a, b) => {
                    let aVoteScore = 0;
                    let bVoteScore = 0;

                    for (let vote of votes.filter((v) => v.submissionId == a.id)) {
                        if (vote.score !== -1) {
                            aVoteScore += vote.score;
                        }
                    }

                    for (let vote of votes.filter((v) => v.submissionId == b.id)) {
                        if (vote.score !== -1) {
                            bVoteScore += vote.score;
                        }
                    }

                    return bVoteScore - aVoteScore;
                });

                for (let i = amount; i < submissions.length; i++) {
                    let submission = submissions[i];
                    cutMaps.push({ submission, voteScore: null });
                    fakeRun ? null : await submission.destroy();
                    count++;
                }
            } else if (!amount || isNaN(amount)) { // preform cutTheshold cut
                for (let submission of submissions) {
                    let noCount = 0;
                    for (let vote of votes.filter((v) => v.submissionId == submission.id)) {
                        if (vote.score == 0) {
                            noCount++;
                        }
                    }

                    if (noCount >= noThreshold) {
                        cutMaps.push({ submission, noCount });
                        fakeRun ? null : await submission.destroy();
                        count++;
                    }
                }
            } else {
                return res.status(400).send({ error: `Invalid cut type.` });
            }

            Logger.log(`Cut ${count} submissions for ${category} - fakeRun: ${fakeRun}`, `Admin`);
            res.send({ message: `Cut ${count} submissions for ${category}`, cuts: cutMaps });
        });

        this.app.delete(`/api/admin/resetVotes`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            let category = req.body.category as string;
            let userIdToRun = req.body.userIdToRun as string;

            if (!category) {
                return res.status(400).send({ error: `Missing category.` });
            }

            if (!validateEnumValue(category, SortedSubmissionsCategory)) {
                return res.status(400).send({ error: `Invalid category.` });
            }

            
            let votes: JudgeVote[];
            if (userIdToRun && isNaN(parseInt(userIdToRun))) {
                return res.status(400).send({ error: `Invalid user id.` });
            }

            if (userIdToRun) {
                votes = await DatabaseHelper.database.judgeVotes.findAll({ where: { judgeId: userIdToRun } });
                Logger.log(`${user.name} has initiated a vote reset in ${category} for User ${userIdToRun} `, `Admin`);
            } else {
                votes = await DatabaseHelper.database.judgeVotes.findAll();
                Logger.log(`${user.name} has initiated a vote reset in ${category} `, `Admin`);
            }

            let submissions: SortedSubmission[] = await DatabaseHelper.database.sortedSubmissions.findAll({ where: { category: category } });
            let count = 0;
            for (let vote of votes) {
                if (submissions.find((s) => s.id == vote.submissionId)) {
                    if (vote.score !== -1 && vote.score !== 0.5) {
                        vote.score = -1;
                        await vote.save();
                        count++;
                    }
                }
            }

            Logger.log(`Reset ${count} votes for ${category}`, `Admin`);
            res.send({ message: `Reset ${count} votes for ${category} (optionally for user ${userIdToRun})` });
        });

        this.app.get(`/api/admin/checkDuplicateVotes`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }

            let votes = await DatabaseHelper.database.judgeVotes.findAll();
            let duplicates: JudgeVote[] = [];
            let count = 0;
            for (let vote of votes) {
                let duplicate = votes.find((v) => v.id !== vote.id && v.submissionId == vote.submissionId && v.judgeId == vote.judgeId);
                if (duplicate) {
                    duplicates.push(vote);
                    count++;
                }
            }

            Logger.log(`Found ${count} duplicate votes.`, `Admin`);
            res.send({ message: `Found ${count} duplicate votes.`, duplicates });
        });

        this.app.get(`/api/admin/getFinalVotes`, async (req, res) => {
            let user = await isAuthroizedSession(req, res);
            if (!user) { return; }
            let doTotalCalc = req.query.total === `true` ? true : false;
            let doAdjustedCalc = req.query.adjusted === `true` ? true : false;
            let category = req.query.category as string;

            if (!category) {
                return res.status(400).send({ error: `Missing category.` });
            }

            if (!validateEnumValue(category, SortedSubmissionsCategory)) {
                return res.status(400).send({ error: `Invalid category.` });
            }

            let submissions = await DatabaseHelper.database.sortedSubmissions.findAll({ where: { category: category } });
            let votes = await DatabaseHelper.database.judgeVotes.findAll();
            let judges = await DatabaseHelper.database.judges.findAll();
            let finalVotes: any[] = [];
            Logger.log(`Getting final votes for ${category} (initiated by ${user.name})`, `Admin`);

            for (let submission of submissions) {
                await new Promise((resolve) => setTimeout(resolve, 300));
                let name = ``;
                let mapper = ``;
                let diff = ``;
                let id = submission.name;
                if (DatabaseHelper.isNameRequiredSortedSubmission(category)) {
                    if (category.includes(`Mapper`) || category.includes(`Lighter`)) {
                        await fetch(`https://api.beatsaver.com/users/id/${id}`).then(async response => {
                            if (response.status !== 200) {
                                return null;
                            }

                            let data = await response.json() as any;
                            name = data.name;
                        });
                    } else {
                        name = submission.name;
                    }
                } else {
                    await fetch(`https://api.beatsaver.com/maps/id/${submission.bsrId}`).then(async (response): Promise<void> => {
                        if (response.status !== 200) {
                            return null;
                        }

                        let json = await response.json() as any;
                        name = `${json.metadata.songAuthorName} - ${json.metadata.songName}`;
                        mapper = json.metadata.levelAuthorName;
                        diff = `${submission.characteristic} ${submission.difficulty}`;
                    });
                }
                // find all votes for this submission
                let submissionVotes = votes.filter((v) => v.submissionId == submission.id && v.score !== -1);
                // filter out votes from judges that don't have the category assigned to them
                submissionVotes = submissionVotes.filter((v) => judges.find((j) => j.id == v.judgeId && j.permittedCategories.includes(submission.category)));
                let totalObj = null;
                if (doTotalCalc) {
                    // calculate total votes and score
                    let totalVotes = submissionVotes.length;
                    let totalScore = 0;
                    for (let vote of submissionVotes) {
                        totalScore += vote.score;
                    }
                    totalObj = {
                        totalVotes,
                        totalScore,
                        precentage: Math.round(totalScore / totalVotes * 100)
                    };
                }
                let adjObj = null;
                if (doAdjustedCalc) {
                    // calculate total votes and score with involved votes removed completely
                    let adjustedSubmissionVotes = submissionVotes.filter((v) => v.score !== 0.5);
                    let totalAdjustedVotes = adjustedSubmissionVotes.length;
                    let totalAdjustedScore = 0;
                    for (let vote of submissionVotes.filter((v) => v.score !== 0.5)) {
                        totalAdjustedScore += vote.score;
                    }
                    adjObj = {
                        totalAdjustedVotes,
                        totalAdjustedScore,
                        precentage: Math.round(totalAdjustedScore / totalAdjustedVotes * 100)
                    };
                }


                let retVal: any;
                if (DatabaseHelper.isNameRequiredSortedSubmission(category)) {
                    retVal = {
                        mapInfo: {
                            name,
                            id
                        },
                        totalVotes: totalObj,
                        adjustedVotes: adjObj
                    };
                } else {
                    retVal = {
                        mapInfo: {
                            bsr: submission.bsrId,
                            name,
                            levelAuthor: mapper,
                            diff
                        },
                        totalVotes: totalObj,
                        adjustedVotes: adjObj
                    };
                }
                finalVotes.push(retVal);
            }

            finalVotes.sort((a, b) => {
                if (`totalAdjustedVotes` in a && `totalAdjustedVotes` in b) {
                    return b.adjustedVotes.precentage - a.adjustedVotes.precentage;
                } else if (`totalVotes` in a && `totalVotes` in b) {
                    return b.totalVotes.precentage - a.totalVotes.precentage;
                } else {
                    return 0;
                }
            });

            res.type(`application/json`);
            res.attachment(`${category}.json`);
            res.status(200).send(JSON.stringify(finalVotes, null, 2));
            Logger.log(`Finished getting final votes for ${category} (initiated by ${user.name})`, `Admin`);
        });
        // #endregion Voting
    }
}

async function isAuthroizedSession(req: any, res: any, allowSelfJudge: boolean | number = false): Promise<Judge | null> {
    if (!req.session.userId && req.session.service !== `judgeId`) {
        res.status(401).send({ error: `Not logged in.` });
        return null;
    }

    let user = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

    if (!user) {
        res.status(403).send({ error: `Not authorized.` });
        return null;
    }

    if (typeof allowSelfJudge === `number`) {
        if (user.id == allowSelfJudge) {
            return user;
        }
    }

    if (!user.roles.includes(`admin`)) {
        res.status(403).send({ error: `Not authorized.` });
        return null;
    }

    return user;
}

async function getMapperAndHash(bsrId: string): Promise<{ hash: string, involvedMappers: string[] } | null> {
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