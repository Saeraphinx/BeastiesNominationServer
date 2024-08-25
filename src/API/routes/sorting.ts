import { Express } from 'express';
import { DatabaseHelper, DatabaseManager, NominationCategory, SortedSubmissionsCategory, validateEnumValue } from '../../Shared/Database';

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
                //return res.status(401).send({ message: `Not logged in.` });
            }

            if (!page || !pageSize) {
                return res.status(400).send({ message: `Invalid Paramenters.` });
            }

            let pageInt = parseInt(page as string);
            let pageSizeInt = parseInt(pageSize as string);

            if (isNaN(pageInt) || isNaN(pageSizeInt)) {
                return res.status(400).send({ message: `Invalid Paramenters.` });
            }

            //const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });
            
            //if (!judge.roles.includes(`sort`)) {
            //    return res.status(403).send({ message: `You do not have permission to sort this category` });
            //}

            //if (!category && typeof category !== `string` && validateEnumValue(category, SortedSubmissionsCategory)) {
            //    return res.status(400).send({ message: `Category is required` });
            //}

            let response = await DatabaseHelper.database.nominations.findAll({ where: { filterStatus: null } });
            let start = pageSizeInt * (pageInt - 1);

            return res.send({data: response.slice(start, start + pageSizeInt), page: pageInt, pageSize: pageSizeInt, totalPages: Math.ceil(response.length / pageSizeInt)});

        });

        this.app.post(`/api/sort/approveSubmission`, async (req, res) => {
            let { name, bsrId, difficulty, characteristic, category, nominationId } = req.body;
            if (!req.session.id && req.session.service !== `judgeId`) {
                return res.status(401).send({ message: `Not logged in.` });
            }

            const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });
            
            if (!category && typeof category !== `string` && validateEnumValue(category, SortedSubmissionsCategory)) {
                return res.status(400).send({ message: `Category is required` });
            }

            if (DatabaseHelper.isNameRequired(category) && !name && typeof name !== `string`) {
                return res.status(400).send({ message: `Name is required for this category` });
            } else if (!bsrId) {
                return res.status(400).send({ message: `BSR ID is required for this category` });
            }

            if (DatabaseHelper.isDiffCharRequired(category) && !difficulty && !characteristic && typeof difficulty !== `string` && typeof characteristic !== `string`) {
                return res.status(400).send({ message: `Difficulty & Charecteristic is required for this category` });
            } else if (category == SortedSubmissionsCategory.FullSpreadMap && !characteristic && typeof characteristic !== `string`) {
                return res.status(400).send({ message: `Charecteristic is required for this category` });
            }

            if (!nominationId && typeof nominationId !== `number`) {
                return res.status(400).send({ message: `Nomination ID is required` });
            }

            let submission = await DatabaseHelper.database.nominations.findOne({ where: { nominationId: nominationId } });
            if (!submission) {
                return res.status(400).send({ message: `Nomination not found` });
            }

            if (!judge.roles.includes(`sort`)) {
                return res.status(403).send({ message: `You do not have permission to sort this category` });
            }

            let sortedSubmission = await DatabaseHelper.database.sortedSubmissions.create({
                name: name,
                bsrId: bsrId,
                difficulty: difficulty,
                characteristic: characteristic,
                category: category,
            });

            if (!sortedSubmission) {
                return res.status(500).send({ message: `Failed to add submission. Maybe it already exists?` });
            }

            await submission.update({
                filterStatus: `Accepted`,
                filtererId: req.session.id,
            });

            let otherSubmissions;
            if (DatabaseHelper.isDiffCharRequired(category)) {
                otherSubmissions = await DatabaseHelper.database.nominations.findAll({ where: { bsrId: bsrId, category: submission.category, difficulty: difficulty, characteristic: characteristic } });
            } else {
                otherSubmissions = await DatabaseHelper.database.nominations.findAll({ where: { name: name, category: submission.category } });
            }

            for (let otherSubmission of otherSubmissions) {
                await otherSubmission.update({
                    filterStatus: `Duplicate`,
                    filtererId: req.session.id,
                });
            }

            return res.status(200).send({ message: `Submission added successfully`, duplicates: otherSubmissions.length, submission: sortedSubmission });
        });

        this.app.post(`/api/sort/rejectSubmission`, async (req, res) => {
            let { id } = req.body;
            if (!req.session.id && req.session.service !== `judgeId`) {
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
                filtererId: req.session.id,
            });

            let duplicateSubmissions = await DatabaseHelper.database.nominations.findAll({ where: { bsrId: submission.bsrId, category: submission.category, difficulty: submission.difficulty } });

            for (let duplicateSubmission of duplicateSubmissions) {
                duplicateSubmission.update({
                    filterStatus: `RejectedDuplicate`,
                    filtererId: req.session.id,
                });
            }

            return res.status(200).send({ message: `Submission removed successfully`, duplicates: duplicateSubmissions.length });
        });
    }
}