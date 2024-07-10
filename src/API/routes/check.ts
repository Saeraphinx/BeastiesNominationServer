import { Express } from 'express';
import { DatabaseHelper, NominationCategory, NominationStatusResponse, validateEnumValue, Difficulty, Characteristic, DifficultyEnum, CharacteristicEnum } from '../../Shared/Database';
import { auth } from '../../../storage/config.json';
import path from 'path';

export class SubmissionRoutes {
    private app: Express;
    private static recentSubmissions: string[] = [];
    private static ip: string[];

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
        setInterval(() => {
            SubmissionRoutes.recentSubmissions = [];
            SubmissionRoutes.ip = [];
        }, 10000);
    }

    private async loadRoutes() {
        this.app.post(`/api/mod/submitmap`, async (req, res) => {
            SubmissionRoutes.ip.push(req.ip);
            if (SubmissionRoutes.ip.filter(ip => ip == req.ip).length > 5) {
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

            switch (SubmissionRoutes.validateSubmission(bsrId, category)) {
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

            switch (await SubmissionRoutes.sendSubmission(gameId, bsrId, category)) {
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
            if (SubmissionRoutes.ip.filter(ip => ip == req.ip).length > 5) {
                res.status(429).send({ message: `Rate limited.` });
                return;
            }

            const bsrId = req.body[`bsrId`];
            const name = req.body[`name`];
            const category = req.body[`category`];
            const charecteristic = req.body[`charecteristic`];
            const difficulty = req.body[`difficulty`];

            SubmissionRoutes.ip.push(req.ip);
            if (SubmissionRoutes.ip.filter(ip => ip == req.ip).length > 5) {
                res.status(429).send({ message: `Rate limited.` });
                return;
            }

            if (!req.session.userId) {
                res.status(401).sendFile(path.resolve(`./src/DemoForm/error.html`));
                return;
            }

            if (!category || typeof category != `string`) {
                res.status(400).sendFile(path.resolve(`./src/DemoForm/error.html`));
                return;
            }

            let isName = DatabaseHelper.isNameRequired(category);
            let isDiffCharRequired = DatabaseHelper.isDiffCharRequired(category);            

            if (isDiffCharRequired) {
                if (charecteristic && typeof charecteristic != `string`) {
                    res.status(400).sendFile(path.resolve(`./src/DemoForm/error.html`));
                    return;
                }

                if (difficulty && typeof difficulty != `string`) {
                    res.status(400).sendFile(path.resolve(`./src/DemoForm/error.html`));
                    return;
                }
            }

            if (!isName) {
                if (!bsrId || typeof bsrId != `string`) {
                    res.status(400).sendFile(path.resolve(`./src/DemoForm/error.html`));
                    return;
                }
            } else {
                if (!name || typeof name != `string`) {
                    res.status(400).sendFile(path.resolve(`./src/DemoForm/error.html`));
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
                    res.status(400).sendFile(path.resolve(`./src/DemoForm/error.html`));
                    return;
                case RequestSubmissionStatus.InvalidCategory:
                    res.status(400).sendFile(path.resolve(`./src/DemoForm/error.html`));
                    return;
                case RequestSubmissionStatus.RateLimited:
                    res.status(429).send({ message: `Rate limited.` });
                    return;
                case RequestSubmissionStatus.OldKey:
                    res.status(400).sendFile(path.resolve(`./src/DemoForm/error.html`));
                    return;
            }

            switch (await SubmissionRoutes.sendSubmission(req.session.userId, category, {
                bsrId: bsrId,
                name: name,
                difficulty: difficulty as Difficulty,
                characteristic: charecteristic as Characteristic
            })) {
                case RequestSubmissionStatus.Invalid:
                    res.status(400).sendFile(path.resolve(`./src/DemoForm/error.html`));
                    return;
                case RequestSubmissionStatus.InvalidCategory:
                    res.status(400).sendFile(path.resolve(`./src/DemoForm/error.html`));
                    return;
                case RequestSubmissionStatus.AlreadyVoted:
                    res.status(400).send({ message: `Already voted.` });
                    return;
                case RequestSubmissionStatus.Success:
                    res.status(200).sendFile(path.resolve(`./src/DemoForm/success.html`));
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
            if (content.bsrId || content.difficulty || content.charecteristic) {
                return RequestSubmissionStatus.Invalid;
            }

            if (!content.name || content.name.length == 0 || content.name.length > 100) {
                return RequestSubmissionStatus.Invalid;
            }

            if (content.name.match(/[a-zA-Z0-9_ ]{1,100}/) == null) {
                return RequestSubmissionStatus.Invalid;
            }

            this.recentSubmissions.push(content.name);
            if (this.recentSubmissions.filter(id => id == content.name).length > 3) {
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

            if (bsrIdNoHex <= 228010) {
                return RequestSubmissionStatus.OldKey;
            }

            this.recentSubmissions.push(content.bsrId);
            if (this.recentSubmissions.filter(id => id == content.bsrId).length > 3) {
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

    private static async sendSubmission(id: string, category: string, content: {
        bsrId?: string;
        name?: string;
        difficulty?: Difficulty;
        characteristic?: Characteristic;
    }): Promise<RequestSubmissionStatus> {
        let status = await DatabaseHelper.addNomination(id, category, content);
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
}


enum RequestSubmissionStatus {
    Invalid,
    InvalidCategory,
    RateLimited,
    OldKey,
    AlreadyVoted,
    Success
}

