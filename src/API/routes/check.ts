import { Express } from 'express';
import { DatabaseHelper, NominationCategory, NominationStatusResponse, validateEnumValue } from '../../Shared/Database';
import { auth } from '../../../storage/config.json';

export class SubmissionRoutes {
    private app: Express;
    private recentSubmissions: string[] = [];

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
        setInterval(() => {
            this.recentSubmissions = [];
        }, 10000);
    }

    private async loadRoutes() {
        this.app.post(`/api/mod/submitmap`, async (req, res) => {
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

            let submissionStatus = this.validateSubmission(bsrId, category);
            switch (submissionStatus) {
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

            
            submissionStatus = await this.sendSubmission(gameId, bsrId, category);
            switch (submissionStatus) {
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

        this.app.post(`/api/submitmap`, async (req, res) => {
            const bsrId = req.body[`bsrId`];
            const category = req.body[`category`];

            if (!req.session.userId) {
                res.status(401).send(`Unauthorized.`);
                return;
            }

            if (!bsrId || !category || typeof bsrId != `string` || typeof category != `string`) {
                res.status(400).send(`Invalid request.`);
                return;
            }

            let submissionStatus = this.validateSubmission(bsrId, category);

            switch (submissionStatus) {
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

            submissionStatus = await this.sendSubmission(req.session.userId, bsrId, category);

            switch (submissionStatus) {
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
    }

    private validateSubmission(bsrId: string, category: string) : RequestSubmissionStatus {
        if (bsrId.length != 5) {
            return RequestSubmissionStatus.Invalid;
        }

        let bsrIdNoHex = parseInt(bsrId, 16);

        if (isNaN(bsrIdNoHex)) {
            return RequestSubmissionStatus.Invalid;
        }

        if (bsrIdNoHex <= 228010) {
            return RequestSubmissionStatus.OldKey;
        }

        if (!validateEnumValue(category, NominationCategory)) {
            return RequestSubmissionStatus.InvalidCategory;
        }

        this.recentSubmissions.push(bsrId);
        if (this.recentSubmissions.filter(id => id == bsrId).length > 3) {
            return RequestSubmissionStatus.RateLimited;
        }
    }

    private async sendSubmission(id: string, bsrId: string, category: string) : Promise<RequestSubmissionStatus> {
        let status = await DatabaseHelper.addNomination(id, bsrId, category);
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