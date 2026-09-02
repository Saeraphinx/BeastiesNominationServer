import path from 'path';
import { exit } from 'process';
import { Sequelize } from 'sequelize-typescript';
import * as env from '$app/env/private';
import { Logger } from '$lib/server/logger';

import { SortedSubmission } from './models/SortedSubmission';
import { Submission } from './models/Submission';
import { PublicVote } from './models/PublicVote';
import { JudgeVote } from './models/JudgeVote';
import { Judge } from './models/Judge';

export * from './models/SortedSubmission';
export * from './models/Submission';
export * from './models/PublicVote';
export * from './models/JudgeVote';
export * from './models/Judge';

export class DatabaseManager {
    public sequelize: Sequelize;

    constructor() {
        this.sequelize = new Sequelize(`database`, `user`, `password`, {
            host: `localhost`,
            dialect: `sqlite`,
            logging: false,
            storage: path.resolve(env.DATABASE_LOCATION)
        });

        Logger.log(`Loading Database...`);
        this.loadTables();
        this.sequelize
            .sync()
            .then(() => {
                Logger.log(`Database Loaded.`);
                this.sequelize
                    .query(`PRAGMA integrity_check;`)
                    .then((healthcheck) => {
                        let healthcheckString = (healthcheck[0][0] as any).integrity_check;
                        Logger.log(`Database health check: ${healthcheckString}`);
                    })
                    .catch((error) => {
                        Logger.error(`Error checking database health: ${error}`);
                    });
                setInterval(
                    () => {
                        this.sequelize
                            .query(`PRAGMA integrity_check;`)
                            .then((healthcheck) => {
                                let healthcheckString = (healthcheck[0][0] as any).integrity_check;
                                Logger.log(`Database health check: ${healthcheckString}`);
                            })
                            .catch((error) => {
                                Logger.error(`Error checking database health: ${error}`);
                            });
                    },
                    1000 * 60 * 60 * 1
                );
            })
            .catch((error) => {
                Logger.error(`Error loading database: ${error}`);
                exit(-1);
            });
    }

    private loadTables() {
        this.sequelize.addModels([
            Judge,
            JudgeVote,
            PublicVote,
            Submission,
            SortedSubmission    
        ]);
    }
}

const SortedSubmissionsCategoryEnglish = {
    OST: [`Gen-OST`, `OST`],
    FullSpreadMap: [`Gen-FullSpread`, `Full Spread`],
    AlternativeMap: [`Gen-NonStandard`, `Non-Standard`],

    LightshowVanilla: [`Lightshow-Vanilla`, `Lightshow Vanilla`],
    LightshowVanillaPlus: [`Lightshow-VanillaPlus`, `Lightshow Vanilla+`],
    LightshowChroma: [`Lightshow-Chroma`, `Lightshow Chroma`],
    LightshowChromaPlus: [`Lightshow-ChromaPlus`, `Lightshow Chroma+`],
    LightshowVivify: [`Lightshow-Vivify`, `Lightshow Vivify`],

    Modchart: [`Mods-GameplayModchart`, `Gameplay Modchart`],
    //ArtMap: [`Mods-ArtMap`, `Art Map`],

    RankedMapBLLessThan8: [`Ranked-BLLessThan8`, `BL Ranked Less than 8*`],
    RankedMapBL8To12: [`Ranked-BL8To12`, `BL Ranked 8* to 12*`],
    RankedMapBL12Plus: [`Ranked-BL12Plus`, `BL Ranked 12* and above`],
    RankedMapSSLessThan8: [`Ranked-SSLessThan8`, `SS Ranked Less than 8*`],
    RankedMapSS8To12: [`Ranked-SS8To12`, `SS Ranked 8* to 12*`],
    RankedMapSS12Plus: [`Ranked-SS12Plus`, `SS Ranked 12* and above`],

    BalancedMap: [`Style-Balanced`, `Balanced`],
    LowTechMap: [`Style-LowTech`, `Low Tech`],
    HighTechMap: [`Style-HighTech`, `High Tech`],
    SpeedMap: [`Style-Speed`, `Speed`],
    DanceMap: [`Style-Dance`, `Dance`],
    FitnessMap: [`Style-Fitness`, `Fitness`],
    ChallengeMap: [`Style-Challenge`, `Challenge`],
    AccMap: [`Style-Acc`, `Acc`],
    PoodleMap: [`Style-Poodle`, `Poodle`],
    WildcardMap: [`Style-Wildcard`, `Wildcard`],

    MapOfTheYear: [`OTY-Map`, `Map of the Year`],
    ModdedMapOfTheYear: [`OTY-ModdedMap`, `Modded Map of the Year`],
    MapperOfTheYear: [`OTY-Mapper`, `Mapper of the Year`],
    LighterOfTheYear: [`OTY-Lighter`, `Lighter of the Year`],
    RookieMapperOfTheYear: [`OTY-RookieMapper`, `Rookie Mapper of the Year`],
    RookieLighterOfTheYear: [`OTY-RookieLighter`, `Rookie Lighter of the Year`],
    PackOfTheYear: [`OTY-Pack`, `Pack of the Year`]
};
/*
    Beasties Admin will go through the nominations and sort them into the correct categories & clean up data (if applicable) [NominationAttributes -> SortedSubmission]

    Judges will be assigned to categories and will be able to vote on the submissions [SortedSubmission -> JudgeVote]

    Judges need to be able to log in, will be using Discord OAuth2 for this since it's the easiest way to verify users are who they say they are.
    Judges need to be given a role from Beasties Admin to be able to vote on a category. [Judges.role && Judges.permittedCategories]

    Judges will be required to list all of their BeatSaver IDs so that I know when to give their votes a bye. [Judges.beatSaverIds]
*/
