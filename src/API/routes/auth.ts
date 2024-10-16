import { Express } from 'express';
import { BeatLeaderAuthHelper, BeatSaverAuthHelper, DiscordAuthHelper } from '../classes/AuthHelper';
import { HTTPTools } from '../classes/HTTPTools';
import { server } from '../../../storage/config.json';
import { DatabaseHelper } from '../../Shared/Database';
import { Logger } from '../../Shared/Logger';

export class AuthRoutes {
    private app: Express;
    private validStates: string[] = [];

    constructor(app: Express) {
        this.app = app;
        this.loadRoutes();
    }

    private async loadRoutes() {
        this.app.get(`/api/auth`, async (req, res) => {
            if (req.session.userId) {
                return res.status(200).send({ message: `Hello, ${req.session.username}!`, username: req.session.username, userId: req.session.userId, service: req.session.service });
            } else {
                return res.status(401).send({ error: `Not logged in.` });
            }
        });

        this.app.get(`/api/auth/judging`, async (req, res) => {
            if (req.session.userId && req.session.service === `judgeId`) {
                return res.status(200).send({ message: `Hello, ${req.session.username}!`, username: req.session.username, userId: req.session.userId, service: req.session.service });
            } else {
                return res.status(401).send({ error: `Not logged in.` });
            }
        });

        this.app.get(`/api/auth/logout`, async (req, res) => {
            req.session.destroy((err) => {
                if (err) {
                    return res.status(500).send({ error: `Internal server error.` });
                }
                return res.status(200).send(`<head><meta http-equiv="refresh" content="0; url=${server.url}" /></head><body style="background-color: black;"><a style="color:white;" href="${server.url}">Click here if you are not redirected...</a></body>`);
            });
        });

        this.app.get(`/api/auth/beatleader`, (req, res) => {
            let state = HTTPTools.createRandomString(16);
            //req.session.state = state;
            //req.session.save();
            this.validStates.push(state + req.ip);
            setTimeout(() => {
                this.validStates = this.validStates.filter((s) => s !== state + req.ip);
            }, 1000 * 60 * 3);
            //return res.status(200).send(`<head><meta http-equiv="refresh" content="0; url=${BeatLeaderAuthHelper.getUrl(state)}" /></head><body><a href="${BeatLeaderAuthHelper.getUrl(state)}">Click here if you are not redirected...</a></body>`);
            return res.redirect(302, BeatLeaderAuthHelper.getUrl(state));
        });

        this.app.get(`/api/auth/beatleader/callback`, async (req, res) => {
            const code = req.query[`code`];
            const state = req.query[`state`];
            if (!code || !state) {
                return res.status(400).send({ error: `Invalid parameters.` });
            }
            //console.log(req.session);
            //if (state !== req.session.state) {
            //    return res.status(400).send({ error: `Invalid state.` });
            //}
            if (!this.validStates.includes(state + req.ip)) {
                return res.status(400).send({ error: `Invalid state.` });
            }
            this.validStates = this.validStates.filter((s) => s !== state + req.ip);
            let token = BeatLeaderAuthHelper.getToken(code.toString());
            if (!token) { return res.status(400).send({ error: `Invalid code.` }); }
            let user = await BeatLeaderAuthHelper.getUser((await token).access_token);
            if (!user) { return res.status(500).send({ error: `Internal server error.` }); }

            req.session.userId = user.id;
            req.session.username = user.name;
            req.session.service = `beatleader`;
            req.session.save();
            return res.status(200).send(`<head><meta http-equiv="refresh" content="0; url=${server.url}" /></head><body style="background-color: black;"><a style="color:white;" href="${server.url}">Click here if you are not redirected...</a></body>`); // i need to double check that this is the correct way to redirect
        });

        this.app.get(`/api/auth/beatsaver`, (req, res) => {
            let state = HTTPTools.createRandomString(16);
            //req.session.state = state;
            //req.session.save();
            this.validStates.push(state + req.ip);
            setTimeout(() => {
                this.validStates = this.validStates.filter((s) => s !== state + req.ip);
            }, 1000 * 60 * 3);
            //return res.status(200).send(`<head><meta http-equiv="refresh" content="0; url=${BeatLeaderAuthHelper.getUrl(state)}" /></head><body><a href="${BeatLeaderAuthHelper.getUrl(state)}">Click here if you are not redirected...</a></body>`);
            return res.redirect(302, BeatSaverAuthHelper.getUrl(state));
        });

        this.app.get(`/api/auth/beatsaver/callback`, async (req, res) => {
            const code = req.query[`code`];
            const state = req.query[`state`];
            if (!code || !state) {
                return res.status(400).send({ error: `Invalid parameters.` });
            }
            //console.log(req.session);
            //if (state !== req.session.state) {
            //    return res.status(400).send({ error: `Invalid state.` });
            //}
            if (!this.validStates.includes(state + req.ip)) {
                return res.status(400).send({ error: `Invalid state.` });
            }
            this.validStates = this.validStates.filter((s) => s !== state + req.ip);
            let token = BeatSaverAuthHelper.getToken(code.toString());
            if (!token) { return res.status(400).send({ error: `Invalid code.` }); }
            let user = await BeatSaverAuthHelper.getUser((await token).access_token);
            if (!user) { return res.status(500).send({ error: `Internal server error.` }); }
            //return res.status(200).send(user);
            req.session.userId = user.id;
            req.session.username = user.name;
            req.session.service = `beatsaver`;
            req.session.save();
            return res.status(200).send(`<head><meta http-equiv="refresh" content="0; url=${server.url}" /></head><body style="background-color: black;"><a style="color:white;" href="${server.url}">Click here if you are not redirected...</a></body>`); // i need to double check that this is the correct way to redirect
        });

        this.app.get(`/api/auth/discord`, (req, res) => {
            let state = HTTPTools.createRandomString(16);
            //req.session.state = state;
            //req.session.save();
            this.validStates.push(state + req.ip);
            setTimeout(() => {
                this.validStates = this.validStates.filter((s) => s !== state + req.ip);
            }, 1000 * 60 * 3);
            //return res.status(200).send(`<head><meta http-equiv="refresh" content="0; url=${BeatLeaderAuthHelper.getUrl(state)}" /></head><body><a href="${BeatLeaderAuthHelper.getUrl(state)}">Click here if you are not redirected...</a></body>`);
            return res.redirect(302, DiscordAuthHelper.getUrl(state));
        });

        this.app.get(`/api/auth/discord/callback`, async (req, res) => {
            const code = req.query[`code`];
            const state = req.query[`state`];
            if (!code || !state) {
                return res.status(400).send({ error: `Invalid parameters.` });
            }
            //console.log(req.session);
            //if (state !== req.session.state) {
            //    return res.status(400).send({ error: `Invalid state.` });
            //}
            if (!this.validStates.includes(state + req.ip)) {
                return res.status(400).send({ error: `Invalid state.` });
            }
            this.validStates = this.validStates.filter((s) => s !== state + req.ip);
            let token = await DiscordAuthHelper.getToken(code.toString());
            if (!token) { return res.status(400).send({ error: `Invalid code.` }); }
            let user = await DiscordAuthHelper.getUser(token.access_token);
            if (!user) { return res.status(500).send({ error: `Internal server error.` }); }

            let judge = await DatabaseHelper.database.judges.findOne({ where: { discordId: user.id } });

            if (!judge) {
                let discordGuildMemberInfo = await DiscordAuthHelper.getGuildMemberData(token.access_token, `452928402203344908`, user.id);
                if (!discordGuildMemberInfo) {
                    return res.status(500).send({ error: `Internal server error.` });
                }
                if (!discordGuildMemberInfo.roles.includes(`933458558408884244`)) {
                    return res.status(403).send({ error: `You are not involved with The Beasties.` });
                }

                judge = await DatabaseHelper.database.judges.create({
                    discordId: user.id,
                    name: user.username,
                    avatarUrl: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
                });
            }

            req.session.userId = judge.id.toString();
            req.session.username = judge.name;
            req.session.service = `judgeId`;
            req.session.save();
            Logger.log(`Judge ${judge.name} logged in.`, `Auth`);
            return res.status(200).send(`<head><meta http-equiv="refresh" content="0; url=${server.url}/judging" /></head><body style="background-color: black;"><a style="color:white;" href="${server.url}/judging">Click here if you are not redirected...</a></body>`); // i need to double check that this is the correct way to redirect
        });
    }
}