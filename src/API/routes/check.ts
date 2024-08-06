import { Express } from 'express';
import { DatabaseHelper, NominationCategory, NominationStatusResponse, validateEnumValue, Difficulty, Characteristic, DifficultyEnum, CharacteristicEnum } from '../../Shared/Database';
import { auth, apiKeys } from '../../../storage/config.json';
import path from 'path';
import fs from 'fs';

export class SubmissionRoutes {
    private app: Express;
    private static recentSubmissions: string[] = [];
    private static ip: string[] = [];
    private static id: string[] = [];
    private static readonly errorHtml = fs.readFileSync(path.resolve(`./assets/error.html`)).toString();

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
        setInterval(() => {
            SubmissionRoutes.recentSubmissions = [];
            SubmissionRoutes.ip = [];
            SubmissionRoutes.id = [];
        }, 20000);
    }

    private async loadRoutes() {
        this.app.post(`/api/mod/submitmap`, async (req, res) => {
            SubmissionRoutes.ip.push(req.ip);
            if (SubmissionRoutes.ip.filter(ip => ip == req.ip).length > 20) {
                res.status(429).send({ message: `Rate limited.` });
                return;
            }
            
            const userId = req.body[`id`];
            const bsrId = req.body[`bsrId`];
            const category = req.body[`category`];
            const ticket = req.body[`ticket`];
            const platform = req.body[`platform`];
            
            if (!userId ||
                !bsrId ||
                !category ||
                !ticket ||
                !platform ||
                typeof userId !== `string` ||
                typeof bsrId !== `string` ||
                typeof category !== `string` ||
                typeof ticket !== `string` ||
                typeof platform !== `string`) {
                res.status(400).send(`Invalid request.`);
                return;
            }

            switch (SubmissionRoutes.validateSubmission(category, {
                bsrId: bsrId,
                name: undefined,
                difficulty: undefined,
                charecteristic: undefined
            })) {
                case RequestSubmissionStatus.Invalid:
                    res.status(400).send({ message: `Invalid request.` });
                    return;
                case RequestSubmissionStatus.InvalidCategory:
                    res.status(400).send({ message: `Invalid category.` });
                    return;
                case RequestSubmissionStatus.RateLimited:
                    res.status(429).send({ message: `Rate limited.` });
                    return;
                case RequestSubmissionStatus.OldKey:
                    res.status(400).send({ message: `Invalid request.` });
                    return;
            }

            let gameId;
            if (platform == `steam`) {
                let steamResponse = await fetch(`https://api.steampowered.com/ISteamUserAuth/AuthenticateUserTicket/v1?key=${auth.steam.clientId}&appid=620980&ticket=${ticket}`);
                if (steamResponse.status != 200) {
                    res.status(500).send(`Internal server error.`);
                    return;
                }
                let steamjsonResponse = await steamResponse.json() as { steamid?: string };
                if (!steamjsonResponse && !steamjsonResponse.steamid) {
                    res.status(400).send(`Invalid request.`);
                    return;
                }
                gameId = steamjsonResponse.steamid;
            } else if (platform == `oculus`) {
                res.status(400).send(`Invalid request.`);
                return;
                //let oculusResponse = await fetch(`https://graph.oculus.com/app?access_token=${ticket}`);

            } else {
                res.status(400).send(`Invalid request.`);
                return;
            }

            switch (await SubmissionRoutes.sendSubmission(gameId, `beatleader`, category, {
                bsrId: bsrId,
                name: undefined,
                difficulty: undefined,
                characteristic: undefined
            }
            )) {
                case RequestSubmissionStatus.Invalid:
                    res.status(400).send({ message: `Invalid request.` });
                    return;
                case RequestSubmissionStatus.InvalidCategory:
                    res.status(400).send({ message: `Invalid category.` });
                    return;
                case RequestSubmissionStatus.AlreadyVoted:
                    res.status(400).send({ message: `Already voted.` });
                    return;
                case RequestSubmissionStatus.Success:
                    res.status(200).send({ message: `Nomination submitted.` });
                    return;
            }
        });

        this.app.post(`/form/submitmap`, async (req, res) => {
            SubmissionRoutes.ip.push(req.ip);
            if (SubmissionRoutes.ip.filter(ip => ip == req.ip).length > 20) {
                res.status(429).send(this.getErrorResponseString(`You've been rate limited. Please try again later.`));
                return;
            }
            const category = req.body[`category`];
            if (!category || typeof category != `string`) {
                res.status(400).send(this.getErrorResponseString(`Invalid request.`));
                return;
            }
            const bsrId = req.body[`bsrId`];
            const name = (category == NominationCategory.OST) ? req.body[`OSTname`] : req.body[`name`];
            const charecteristic = req.body[`charecteristic`];
            const difficulty = req.body[`difficulty`];

            if (!req.session.userId) {
                res.status(401).send(this.getErrorResponseString(`You need to be logged in to submit a nomination.`));
                return;
            }

            if (SubmissionRoutes.id.filter(id => id == req.session.userId).length > 5) {
                res.status(429).send(this.getErrorResponseString(`You've submitted maps too quickly. Please try again later.`));
                return;
            }

            let isName = DatabaseHelper.isNameRequired(category);
            let isDiffCharRequired = DatabaseHelper.isDiffCharRequired(category);

            if (isDiffCharRequired) {
                if (charecteristic && typeof charecteristic != `string`) {
                    res.status(400).send(this.getErrorResponseString(`Invalid request.`));
                    return;
                }

                if (difficulty && typeof difficulty != `string`) {
                    res.status(400).send(this.getErrorResponseString(`Invalid request.`));
                    return;
                }
            }

            if (!isName) {
                if (!bsrId || typeof bsrId != `string`) {
                    res.status(400).send(this.getErrorResponseString(`Invalid request.`));
                    return;
                }
            } else {
                if (!name || typeof name != `string`) {
                    res.status(400).send(this.getErrorResponseString(`Invalid request.`));
                    return;
                }
            }

            switch (SubmissionRoutes.validateSubmission(category, {
                bsrId: bsrId,
                name: name,
                difficulty: difficulty,
                charecteristic: charecteristic
            })) {
                case RequestSubmissionStatus.Invalid:
                    res.status(400).send(this.getErrorResponseString(`One or more of the fields are invalid.`));
                    return;
                case RequestSubmissionStatus.InvalidCategory:
                    res.status(400).send(this.getErrorResponseString(`Invalid request.`));
                    return;
                case RequestSubmissionStatus.RateLimited:
                    res.status(429).send(this.getErrorResponseString(`You've been rate limited. Please try again later.`));
                    return;
                case RequestSubmissionStatus.OldKey:
                    res.status(400).send(this.getErrorResponseString(`This BSR key is not eligible for submission.`));
                    return;
            }

            switch (await SubmissionRoutes.sendSubmission(req.session.userId, req.session.service, category, {
                bsrId: bsrId,
                name: name,
                difficulty: difficulty as Difficulty,
                characteristic: charecteristic as Characteristic
            })) {
                case RequestSubmissionStatus.Invalid:
                    res.status(400).send(this.getErrorResponseString(`Invalid request.`));
                    return;
                case RequestSubmissionStatus.InvalidCategory:
                    res.status(400).send(this.getErrorResponseString(`Invalid category.`));
                    return;
                case RequestSubmissionStatus.AlreadyVoted:
                    res.status(400).send(this.getErrorResponseString(`You've already submitted this map.`));
                    return;
                case RequestSubmissionStatus.Success:
                    res.status(200).sendFile(path.resolve(`./assets/success.html`));
                    return;
            }
        });

        this.app.post(`/api/beatleader/submitmap`, async (req, res) => {
            const category = req.body[`category`];
            if (!category || typeof category != `string`) {
                res.status(400).send({ message: `Invalid request.` });
                return;
            }
            const bsrId = req.body[`bsrId`];
            const name = (category == NominationCategory.OST) ? req.body[`OSTname`] : req.body[`name`];
            const charecteristic = req.body[`charecteristic`];
            const difficulty = req.body[`difficulty`];
            const userId = req.body[`userId`];
            const apiKey = req.get(`Authorization`);
            if (!apiKey || typeof apiKey != `string`) {
                res.status(401).send({ message: `Unauthorized.` });
                return;
            }
            
            if (apiKey != `Bearer ${apiKeys.beatleader}`) {
                res.status(401).send({ message: `Unauthorized.` });
                return;
            }

            if (!userId || typeof userId != `string`) {
                res.status(400).send({ message: `Missing User ID.` });
                return;
            }

            let isName = DatabaseHelper.isNameRequired(category);
            let isDiffCharRequired = DatabaseHelper.isDiffCharRequired(category);

            if (isDiffCharRequired) {
                if (charecteristic && typeof charecteristic != `string`) {
                    res.status(400).send({ message: `Invalid characteristic.` });
                    return;
                }

                if (difficulty && typeof difficulty != `string`) {
                    res.status(400).send({ message: `Invalid difficulty.` });
                    return;
                }
            }

            if (!isName) {
                if (!bsrId || typeof bsrId != `string`) {
                    res.status(400).send({ message: `Invalid BSR ID.` });
                    return;
                }
            } else {
                if (!name || typeof name != `string`) {
                    res.status(400).send({ message: `Invalid name.` });
                    return;
                }
            }

            switch (SubmissionRoutes.validateSubmission(category, {
                bsrId: bsrId,
                name: name,
                difficulty: difficulty,
                charecteristic: charecteristic
            })) {
                case RequestSubmissionStatus.Invalid:
                    res.status(400).send({ message: `One or more fields is invalid` });
                    return;
                case RequestSubmissionStatus.InvalidCategory:
                    res.status(400).send({ message: `Invalid category.` });
                    return;
                case RequestSubmissionStatus.RateLimited:
                    res.status(429).send({ message: `Rate limited.` });
                    return;
                case RequestSubmissionStatus.OldKey:
                    res.status(400).send({ message: `This key is not eligble for submission.` });
                    return;
            }

            switch (await SubmissionRoutes.sendSubmission(userId, `beatleader`, category, {
                bsrId: bsrId,
                name: name,
                difficulty: difficulty as Difficulty,
                characteristic: charecteristic as Characteristic
            })) {
                case RequestSubmissionStatus.Invalid:
                    res.status(400).send({ message: `Invalid request.` });
                    return;
                case RequestSubmissionStatus.InvalidCategory:
                    res.status(400).send({ message: `Invalid category.` });
                    return;
                case RequestSubmissionStatus.AlreadyVoted:
                    res.status(400).send({ message: `Already voted.` });
                    return;
                case RequestSubmissionStatus.Success:
                    console.log(`Map submitted from BeatLeader.`);
                    res.status(200).send({ message: `Map submitted.` });
                    return;
            }
        });
    }

    private static validateSubmission(category: string, content: {
        bsrId?: string,
        name?: string
        difficulty?: string,
        charecteristic?: string
    }): RequestSubmissionStatus {
        if (!validateEnumValue(category, NominationCategory)) {
            return RequestSubmissionStatus.InvalidCategory;
        }

        let isName = DatabaseHelper.isNameRequired(category);
        let isDiffCharRequired = DatabaseHelper.isDiffCharRequired(category);

        if (isName) {
            if (content.bsrId) {
                return RequestSubmissionStatus.Invalid;
            }

            if (DatabaseHelper.isDiffCharRequired(category) && (!content.difficulty || !content.charecteristic)) {
                return RequestSubmissionStatus.Invalid;
            } else if (!DatabaseHelper.isDiffCharRequired(category) && (content.difficulty || content.charecteristic)) { // this is probably not necessary
                return RequestSubmissionStatus.Invalid;
            }

            if (!content.name || content.name.length == 0 || content.name.length > 100) {
                return RequestSubmissionStatus.Invalid;
            }

            if (content.name.match(/[a-zA-Z:\-_/0-9. ]{1,100}/) == null) {
                return RequestSubmissionStatus.Invalid;
            }

            this.recentSubmissions.push(content.name);
            if (this.recentSubmissions.filter(id => id == content.name).length > 10) {
                return RequestSubmissionStatus.RateLimited;
            }
        } else {
            if (content.bsrId.length != 5) {
                return RequestSubmissionStatus.Invalid;
            }

            if (content.bsrId.match(/[0123456789abcdefABCDEF]{5}/) == null) {
                return RequestSubmissionStatus.Invalid;
            }

            let bsrIdNoHex = parseInt(content.bsrId, 16);

            if (isNaN(bsrIdNoHex)) {
                return RequestSubmissionStatus.Invalid;
            }

            if (bsrIdNoHex <= 228010 && category != NominationCategory.RankedMap) {
                return RequestSubmissionStatus.OldKey;
            }

            this.recentSubmissions.push(content.bsrId);
            if (this.recentSubmissions.filter(id => id == content.bsrId).length > 10) {
                return RequestSubmissionStatus.RateLimited;
            }

            if (isDiffCharRequired) {
                if (!content.difficulty || !content.charecteristic) {
                    return RequestSubmissionStatus.Invalid;
                }

                if (!validateEnumValue(content.difficulty, DifficultyEnum) || !validateEnumValue(content.charecteristic, CharacteristicEnum)) {
                    return RequestSubmissionStatus.Invalid;
                }
            }
        }

        return RequestSubmissionStatus.Success;
    }

    private static async sendSubmission(id: string, service: `beatleader`|`beatsaver`, category: string, content: {
        bsrId?: string;
        name?: string;
        difficulty?: Difficulty;
        characteristic?: Characteristic;
    }): Promise<RequestSubmissionStatus> {
        let status = await DatabaseHelper.addNomination(id, service, category, content);
        switch (status) {
            case NominationStatusResponse.Invalid:
                return RequestSubmissionStatus.Invalid;
            case NominationStatusResponse.InvalidCategory:
                return RequestSubmissionStatus.InvalidCategory;
            case NominationStatusResponse.AlreadyVoted:
                return RequestSubmissionStatus.AlreadyVoted;
            case NominationStatusResponse.Accepted:
                return RequestSubmissionStatus.Success;
        }
    }

    private getErrorResponseString(message: string): string {
        return SubmissionRoutes.errorHtml.replace(`##ERRORTEXT##`, message);
    }
}


enum RequestSubmissionStatus {
    Invalid,
    InvalidCategory,
    RateLimited,
    OldKey,
    AlreadyVoted,
    Success
}

