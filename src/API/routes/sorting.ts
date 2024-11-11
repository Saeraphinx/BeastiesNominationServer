import { Express } from 'express';
import { DatabaseHelper, DatabaseManager, NominationAttributes, NominationCategory, SortedSubmissionsCategory, validateEnumValue } from '../../Shared/Database';
import { Model } from 'sequelize';
import { Logger } from '../../Shared/Logger';

export class SortingRoutes {
    private app: Express;

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        this.app.get(`/api/sort/submissions`, async (req, res) => {
            const { category, page, pageSize } = req.query;
            if (!req.session.userId && req.session.service !== `judgeId`) {
                return res.status(401).send({ message: `Not logged in.` });
            }

            if (!page || !pageSize) {
                return res.status(400).send({ message: `Invalid Paramenters.` });
            }

            let pageInt = parseInt(page as string);
            let pageSizeInt = parseInt(pageSize as string);

            if (isNaN(pageInt) || isNaN(pageSizeInt)) {
                return res.status(400).send({ message: `Invalid Paramenters.` });
            }

            const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });
            
            if (!judge.roles.includes(`sort`)) {
                return res.status(403).send({ message: `You do not have permission to sort this category` });
            }

            //if (!category && typeof category !== `string` && validateEnumValue(category, SortedSubmissionsCategory)) {
            //    return res.status(400).send({ message: `Category is required` });
            //}

            let response: NominationAttributes[];
            if (category && category !== `All`) {
                response = await DatabaseHelper.database.nominations.findAll({ where: { filterStatus: null, category: category.toString() } });
            } else {
                response = await DatabaseHelper.database.nominations.findAll({ where: { filterStatus: null } });
            }
            let start = pageSizeInt * (pageInt - 1);

            console.log(`Sending submissions to user ${req.session.userId} (${start} to ${start + pageSizeInt} of ${response.length})`);
            return res.send({data: response.slice(start, start + pageSizeInt), page: pageInt, pageSize: pageSizeInt, totalPages: Math.ceil(response.length / pageSizeInt)});

        });

        this.app.post(`/api/sort/approveSubmission`, async (req, res) => {
            let { name, bsrId, difficulty, characteristic, category, nominationId } = req.body;
            if (!req.session.id || req.session.service !== `judgeId`) {
                return res.status(401).send({ message: `Not logged in.` });
            }

            const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!judge.roles.includes(`sort`)) {
                return res.status(403).send({ message: `You do not have permission to sort.` });
            }
            
            if (!category && typeof category !== `string` && validateEnumValue(category, SortedSubmissionsCategory)) {
                return res.status(400).send({ message: `Category is required` });
            }

            if (DatabaseHelper.isNameRequiredSortedSubmission(category) && !name && typeof name !== `string`) {
                return res.status(400).send({ message: `Name is required for this category` });
            } else if (!DatabaseHelper.isNameRequiredSortedSubmission(category) && !bsrId) {
                return res.status(400).send({ message: `BSR ID is required for this category` });
            }

            if (DatabaseHelper.isDiffCharRequiredSortedSubmission(category) && !difficulty && !characteristic && typeof difficulty !== `string` && typeof characteristic !== `string`) {
                return res.status(400).send({ message: `Difficulty & Charecteristic is required for this category` });
            }

            if (!nominationId && typeof nominationId !== `number`) {
                return res.status(400).send({ message: `Nomination ID is required` });
            }

            let submission = await DatabaseHelper.database.nominations.findOne({ where: { nominationId: nominationId } });
            if (!submission) {
                return res.status(400).send({ message: `Nomination not found` });
            }

            let involvedMappers:any[] = [];
            let hash = null;

            if (!DatabaseHelper.isNameRequiredSortedSubmission(category)) {
                let parsedBSR = parseInt(bsrId, 16);
                if (isNaN(parsedBSR)) {
                    return res.status(400).send({ message: `Invalid BSR ID` });
                }
                await fetch(`https://api.beatsaver.com/maps/id/${parsedBSR.toString(16)}`).then(async (response) => {
                    if (response.status !== 200) {
                        return res.status(400).send({ message: `Invalid BSR ID` });
                    }

                    let json = await response.json() as any;
                    hash = json.versions[0].hash;
                    involvedMappers.push(json.uploader.id as string);
                    if (json.collaborators) {
                        json.collaborators.forEach((collab:any) => {
                            involvedMappers.push(collab.id as string);
                        });
                    }
                });
            }

            let sortedSubmission;
            try {
                sortedSubmission = await DatabaseHelper.database.sortedSubmissions.create({
                    name: name,
                    bsrId: bsrId,
                    difficulty: difficulty,
                    characteristic: characteristic,
                    category: category,
                    hash: hash,
                    involvedMappers: (involvedMappers as string[]),
                });
            } catch (e) {
                Logger.warn(`Failed to add submission: ${e}`);
                return res.status(500).send({ message: `Failed to add submission. This shouldn't happen...` });
            }

            if (!sortedSubmission) {
                Logger.warn(`Failed to add submission`);
                return res.status(500).send({ message: `Failed to add submission. Maybe it already exists?` });
            }

            await submission.update({
                filterStatus: `Accepted`,
                filtererId: req.session.userId,
            });

            let otherSubmissions;
            if (DatabaseHelper.isDiffCharRequiredSortedSubmission(category)) {
                otherSubmissions = await DatabaseHelper.database.nominations.findAll({ where: { bsrId: bsrId, category: submission.category, difficulty: difficulty, characteristic: characteristic } });
            } else if (DatabaseHelper.isNameRequiredSortedSubmission(category)) {
                otherSubmissions = await DatabaseHelper.database.nominations.findAll({ where: { name: name, category: submission.category } });
            } else {
                otherSubmissions = await DatabaseHelper.database.nominations.findAll({ where: { bsrId: name, category: submission.category } });
            }

            for (let otherSubmission of otherSubmissions) {
                if (otherSubmission.nominationId == submission.nominationId) {
                    continue;
                }
                await otherSubmission.update({
                    filterStatus: `Duplicate`,
                    filtererId: req.session.userId,
                });
            }

            Logger.log(`User ${req.session.userId} accepted submission ${submission.nominationId} to ${submission.category} with ${otherSubmissions.length} duplicates`);
            return res.status(200).send({ message: `Submission added successfully`, duplicates: otherSubmissions.length, submission: sortedSubmission });
        });

        this.app.post(`/api/sort/rejectSubmission`, async (req, res) => {
            let { id } = req.body;
            if (!req.session.userId && req.session.service !== `judgeId`) {
                return res.status(401).send({ message: `Not logged in.` });
            }

            if (!id && typeof id !== `number`) {
                return res.status(400).send({ message: `ID is required` });
            }

            let submission = await DatabaseHelper.database.nominations.findOne({ where: { nominationId: id } });
            if (!submission) {
                return res.status(400).send({ message: `Submission not found` });
            }

            const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!judge.roles.includes(`sort`)) {
                return res.status(403).send({ message: `You do not have permission to remove this submission` });
            }

            submission.update({
                filterStatus: `Rejected`,
                filtererId: req.session.userId,
            });

            let duplicateSubmissions = await DatabaseHelper.database.nominations.findAll({ where: { bsrId: submission.bsrId, category: submission.category, difficulty: submission.difficulty, name: submission.name, characteristic: submission.characteristic } });

            for (let duplicateSubmission of duplicateSubmissions) {
                if (duplicateSubmission.nominationId == submission.nominationId) {
                    continue;
                }
                duplicateSubmission.update({
                    filterStatus: `RejectedDuplicate`,
                    filtererId: req.session.userId,
                });
            }

            Logger.log(`User ${req.session.userId} rejected submission ${submission.nominationId} with ${duplicateSubmissions.length} duplicates`);
            return res.status(200).send({ message: `Submission removed successfully`, duplicates: duplicateSubmissions.length });
        });
    }
}