import { Express } from 'express';
import { DatabaseHelper, Judge, SortedSubmissionsCategory, SortedSubmissionsCategoryEnglish, validateEnumValue } from '../../Shared/Database';
import { server } from '../../../storage/config.json';
import { Logger } from '../../Shared/Logger';

export class JudgeingRoutes {
    private app: Express;

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        this.app.get(`/api/judge/roleCheck`, async (req, res) => {
            const { category } = req.query;
            let result = await this.processJudge(req, res, category);

            if (result === false) {
                return;
            }

            return res.status(200).send({ message: `Allowed to judge ${result.category}` });
        });

        this.app.get(`/api/judge/getCategories`, async (req, res) => {
            if (!req.session.userId && req.session.service !== `judgeId`) {
                return res.status(401).send({ message: `Not logged in.` });
            }

            const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

            if (!judge.roles.includes(`judge`)) {
                return res.status(403).send({ message: `You do not have permission to judge.` });
            }

            return res.status(200).send({ username: req.session.username, categories: judge.permittedCategories, allCategories: SortedSubmissionsCategoryEnglish });
        });

        this.app.get(`/api/judge/getSubmissions`, async (req, res) => {
            const { category, page, pageSize } = req.query;
            let result = await this.processJudge(req, res, category);

            if (result === false) {
                return;
            }

            let pageInt = parseInt(page as string);
            let pageSizeInt = parseInt(pageSize as string);

            if (isNaN(pageInt) || isNaN(pageSizeInt)) {
                return res.status(400).send({ message: `Invalid Parameters.` });
            }

            let response = await DatabaseHelper.database.sortedSubmissions.findAll({ where: { category: result.category } });
            let start = pageSizeInt * (pageInt - 1);

            console.log(`User ${result.judge.id} - Sending submissions ${start} to ${start + pageSizeInt} of ${response.length}`);
            let response_Sliced = response.slice(start, start + pageSizeInt);
            let existingVotes = [];
            for (let response in response_Sliced) {
                const curRes = response_Sliced[response];
                const votes = await DatabaseHelper.database.judgeVotes.findOne({ where: { submissionId: curRes.id, judgeId: result.judge.id } });
                existingVotes.push(votes);
            }
            return res.send({ submissiondata: response_Sliced, voteData: existingVotes, page: pageInt, pageSize: pageSizeInt, totalPages: Math.ceil(response.length / pageSizeInt) });
        });

        this.app.post(`/api/judge/vote`, async (req, res) => {
            const { submissionId, vote, note } = req.body;

            if (!submissionId) {
                return res.status(400).send({ message: `Invalid Submission ID.` });
            }

            let submission = await DatabaseHelper.database.sortedSubmissions.findOne({ where: { id: submissionId } });

            if (!submission) {
                return res.status(404).send({ message: `Submission not found.` });
            }

            let result = await this.processJudge(req, res, submission.category);

            if (result === false) {
                return;
            }

            let voteNumber = parseFloat(vote);

            if (isNaN(voteNumber) || (voteNumber !== 1 && voteNumber != 0 && voteNumber != 0.5)) {
                return res.status(400).send({ message: `Invalid Vote.` });
            }

            let existingVote = await DatabaseHelper.database.judgeVotes.findOne({ where: { submissionId, judgeId: req.session.userId } });

            let updateNote = false;
            if (!note && (typeof note !== `string` || note.length > 500)) {
                return res.status(400).send({ message: `Invalid Note.` });
            } else {
                updateNote = true;
            }

            if (existingVote) {
                existingVote.score = voteNumber;
                existingVote.notes = updateNote ? note : existingVote.notes;
                await existingVote.save();
                Logger.log(`User ${req.session.userId} updated their vote for submission ${submissionId} to ${voteNumber}`, `Judge`);
                return res.status(200).send({ message: `Vote Updated.` });
            } else {
                await DatabaseHelper.database.judgeVotes.create({
                    submissionId: submissionId,
                    judgeId: parseInt(req.session.userId),
                    score: voteNumber,
                    notes: updateNote ? note : ``
                });
                Logger.log(`User ${req.session.userId} voted for submission ${submissionId} (score: ${voteNumber})`, `Judge`);
                return res.status(200).send({ message: `Vote Submitted.` });
            }
        });

        this.app.get(`/api/beatsaver/playlist/:id`, async (req, res) => {
            const { id } = req.params;
            let result = await this.processJudge(req, res, SortedSubmissionsCategory.PackOfTheYear);

            if (result === false) {
                return;
            }

            let idInt = parseInt(id);

            if (isNaN(idInt)) {
                return res.status(400).send({ message: `Invalid Parameters.` });
            }

            fetch(`https://api.beatsaver.com/playlists/id/${idInt}`).then(async (response) => {
                if (response.status !== 200) {
                    return res.status(400).send({ message: `Invalid Playlist ID` });
                }

                let json = await response.json() as any;
                return res.status(200).send(json);
            });
        });
    
        this.app.get(`/api/judge/playlist`, async (req, res) => {
            const { category } = req.query;
            if (!category || typeof category !== `string` || !validateEnumValue(category, SortedSubmissionsCategory)) {
                res.status(400).send({ error: `Invalid Parameters.` });
                return false;
            }

            let submissions = await DatabaseHelper.database.sortedSubmissions.findAll({ where: { category: category } });
            const playlist: { playlistTitle: string, playlistAuthor: string, playlistDescription:string, image:string, syncURL: string, songs: {key:string, hash:string, difficulties?:{characteristic:string, name:string}[]}[] } = {
                playlistTitle: `${category} - 2024 Beasties`,
                playlistAuthor: `BeastiesNominationServer`,
                playlistDescription: ``,
                image: `${server.url}/cdn/beastsaber.jpg`,
                syncURL: `${server.url}/api/judge/playlist?category=${category}`,
                songs: []
            };

            for (let submission in submissions) {
                const curRes = submissions[submission];
                if (curRes.bsrId === null) {
                    continue;
                } else {
                    if (!curRes.hash || isEmptyOrSpaces(curRes.hash)) {
                        await fetch(`https://api.beatsaver.com/maps/id/${curRes.bsrId}`).then(async (response) => {
                            if (response.status !== 200) {
                                return res.status(500).send({ message: `Invalid BSR ID` });
                            }
                            let json = await response.json() as any;
                            curRes.hash = json.versions[0].hash;
                            curRes.save();
                        });
                        console.log(`Submission ${curRes.id} has no hash, skipping...`);
                    }
                }
                if (curRes.characteristic && curRes.difficulty && !isEmptyOrSpaces(curRes.characteristic) && !isEmptyOrSpaces(curRes.difficulty)) {
                    playlist.songs.push({ key: curRes.bsrId, hash: curRes.hash, difficulties: [{ characteristic: curRes.characteristic, name: curRes.difficulty }] });
                } else {
                    playlist.songs.push({ key: curRes.bsrId, hash: curRes.hash });
                }
            }
            Logger.log(`User ${req.session.userId} requested a playlist generated for ${category}`, `Judge`);
            return res.type(`bplist`).send(playlist);
        });
    }

    private async processJudge(req:any, res: any, category: any): Promise<false | { status: boolean, judge: Judge, category: string }> {
        if (!req.session.userId && req.session.service !== `judgeId`) {
            res.status(401).send({ error: `Not logged in.` });
            return false;
        }

        if (!category || typeof category !== `string` || !validateEnumValue(category, SortedSubmissionsCategory)) {
            res.status(400).send({ error: `Invalid Parameters.` });
            return false;
        }

        const judge = await DatabaseHelper.database.judges.findOne({ where: { id: req.session.userId } });

        if (!judge.roles.includes(`sort`)) {
            if (!judge.roles.includes(`judge`)) {
                res.status(403).send({ error: `You do not have permission to judge or sort` });
                return false;
            }

            if (!judge.roles.includes(`judge`)) {
                res.status(403).send({ error: `You do not have permission to judge` });
                return false;
            }

            if (!judge.permittedCategories.includes(category as SortedSubmissionsCategory)) {
                res.status(403).send({ error: `You do not have permission to judge this category` });
                return false;
            }
        }

        return { status: true, judge, category };
    }
}
// i thought js had this but ig its only C#
function isEmptyOrSpaces(str:string) {
    return str === null || str.match(/^ *$/) !== null;
}