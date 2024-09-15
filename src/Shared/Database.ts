import path from "path";
import { exit } from "process";
import { DataTypes, InferAttributes, InferCreationAttributes, Model, ModelStatic, Op, Sequelize } from "sequelize";
import { storage } from '../../storage/config.json';

export class DatabaseManager {
    public sequelize: Sequelize;
    public nominations: ModelStatic<NominationAttributes>;
    public sortedSubmissions: ModelStatic<SortedSubmission>;
    public judges: ModelStatic<Judge>;
    public judgeVotes: ModelStatic<JudgeVote>;

    constructor() {
        this.sequelize = new Sequelize(`database`, `user`, `password`, {
            host: `localhost`,
            dialect: `sqlite`,
            logging: false,
            storage: path.resolve(storage.database),
        });

        console.log(`Loading Database...`);
        this.loadTables();
        this.sequelize.sync().then(() => {
            console.log(`Database Loaded.`);
            new DatabaseHelper(this);
        }).catch((error) => {
            console.error(`Error loading database: ${error}`);
            exit(-1);
        });
    }

    private loadTables() {
        this.nominations = this.sequelize.define<NominationAttributes>(`nominations`, {
            nominationId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            submitterId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            service: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            bsrId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            difficulty: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            characteristic: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            category: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            filterStatus: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            filtererId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        });

        this.sortedSubmissions = this.sequelize.define<SortedSubmission>(`sortedSubmissions`, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            category: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            bsrId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            difficulty: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            characteristic: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            hash: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            involvedMappers: {
                type: DataTypes.STRING,
                allowNull: true,
                get() {
                    // @ts-expect-error 2345
                    return JSON.parse(this.getDataValue(`involvedMappers`));
                },
                set(value: string[]) {
                    // @ts-expect-error 2345
                    this.setDataValue(`involvedMappers`, JSON.stringify(value));
                },
            },
        });

        this.judges = this.sequelize.define<Judge>(`judges`, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            roles: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: JSON.stringify([]),
                get() {
                    // @ts-expect-error 2345
                    return JSON.parse(this.getDataValue(`roles`));
                },
                set(value: string[]) {
                    // @ts-expect-error 2345
                    this.setDataValue(`roles`, JSON.stringify(value));
                }
            },
            discordId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            avatarUrl: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            beatSaverIds: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: JSON.stringify([]),
                get() {
                    // @ts-expect-error 2345
                    return JSON.parse(this.getDataValue(`beatSaverIds`));
                },
                set(value: string[]) {
                    // @ts-expect-error 2345
                    this.setDataValue(`beatSaverIds`, JSON.stringify(value));
                },
            },
            permittedCategories: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: JSON.stringify([]),
                get() {
                    // @ts-expect-error 2345
                    return JSON.parse(this.getDataValue(`permittedCategories`));
                },
                set(value: string[]) {
                    // @ts-expect-error 2345
                    this.setDataValue(`permittedCategories`, JSON.stringify(value));
                },
            },
        });

        this.judgeVotes = this.sequelize.define<JudgeVote>(`judgeVotes`, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            judgeId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            submissionId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            score: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            notes: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        });
    }
}


export class NominationAttributes extends Model<InferAttributes<NominationAttributes>, InferCreationAttributes<NominationAttributes>> {
    public nominationId: number;
    public submitterId: string;
    public service: `beatleader` | `beatsaver` | `judgeId`;
    public bsrId: string;
    public name: string;
    public difficulty: Difficulty;
    public characteristic: Characteristic;
    public category: string;
    public filterStatus?: FilterStatus;
    public filtererId: string; // if not null, this nomination was filtered by the user mentioned here
}

// #region Nominations
export type Difficulty = `Easy` | `Normal` | `Hard` | `Expert` | `ExpertPlus` | `All`;
export enum DifficultyEnum {
    Easy = `Easy`,
    Normal = `Normal`,
    Hard = `Hard`,
    Expert = `Expert`,
    ExpertPlus = `ExpertPlus`,
    All = `All`,
    Other = `Other`,
}
export type Characteristic = `Standard` | `OneSaber` | `NoArrows` | `90Degree` | `360Degree` | `Lightshow` | `Lawless` | `Other` | `All`;
export type FilterStatus = `Accepted` | `Rejected` | `Duplicate` | `RejectedDuplicate`;

export enum CharacteristicEnum {
    Standard = `Standard`,
    OneSaber = `OneSaber`,
    NoArrows = `NoArrows`,
    NinetyDegree = `90Degree`,
    ThreeSixtyDegree = `360Degree`,
    Lightshow = `Lightshow`,
    Lawless = `Lawless`,
    Other = `Other`,
    All = `All`,
}

export enum NominationCategory {
    OST = `Gen-OST`,
    AlternativeMap = `Gen-Alternative`, //360,90,one saber, na
    FullSpreadMap = `Gen-FullSpread`,

    Lightshow = `Mods-Lightshow`,
    Modchart = `Mods-Modchart`,
    ArtMap = `Mods-ArtMap`,

    RankedMap = `Ranked-RankedMap`,

    BalancedMap = `Style-Balanced`,
    TechMap = `Style-Tech`,
    SpeedMap = `Style-Speed`,
    DanceMap = `Style-Dance`,
    FitnessMap = `Style-Fitness`,
    ChallengeMap = `Style-Challenge`,
    AccMap = `Style-Acc`,
    PoodleMap = `Style-Poodle`,
    GimmickMap = `Style-Gimmick`,

    PackOfTheYear = `OTY-Pack`,
    MapOfTheYear = `OTY-Map`,
    MapperOfTheYear = `OTY-Mapper`,
    LighterOfTheYear = `OTY-Lighter`,
    RookieLighterOfTheYear = `OTY-RookieLighter`,
    RookieMapperOfTheYear = `OTY-RookieMapper`,
}

export class DatabaseHelper {
    public static database: DatabaseManager;

    constructor(db: DatabaseManager) {
        DatabaseHelper.database = db;
    }

    public static async addNomination(submitterId: string, service:`beatleader`|`beatsaver`|`judgeId`, category: string, content: {
        bsrId?: string,
        name?: string,
        difficulty?: Difficulty,
        characteristic?: Characteristic,
    }): Promise<NominationStatusResponse> {
        let existingRecords;
        let sortedrecord: NominationAttributes;
        if (this.isNameRequired(category)) {
            existingRecords = await DatabaseHelper.database.nominations.findAndCountAll({ where: { submitterId: submitterId, name: content.name, category: category } });
            sortedrecord = await DatabaseHelper.database.nominations.findOne({where: { category: category, name: content.name, filterStatus: {[Op.not]: null}}});
        } else {
            if (this.isDiffCharRequired(category)) {
                existingRecords = await DatabaseHelper.database.nominations.findAndCountAll({ where: { submitterId: submitterId, bsrId: content.bsrId, category: category, difficulty: content.difficulty, characteristic: content.characteristic } });
                sortedrecord = await DatabaseHelper.database.nominations.findOne({where: {bsrId: content.bsrId, category: category, characteristic: content.characteristic, difficulty: content.difficulty, filterStatus: {[Op.not]: null}}});
            } else {
                existingRecords = await DatabaseHelper.database.nominations.findAndCountAll({ where: { submitterId: submitterId, bsrId: content.bsrId, category: category } });
                sortedrecord = await DatabaseHelper.database.nominations.findOne({where: { bsrId: content.bsrId, category: category, filterStatus: {[Op.not]: null} }});
            }
        }

        if (existingRecords.count > 0) {
            return NominationStatusResponse.AlreadyVoted;
        }

        if (!validateEnumValue(category, NominationCategory)) {
            return NominationStatusResponse.InvalidCategory;
        }

        let sortedRecordInfo: {isSorted:boolean, status?: FilterStatus, filtererId?:string};
        sortedRecordInfo = {isSorted: false};
        switch (sortedrecord?.filterStatus) {
            case `Accepted`:
            case `Duplicate`:
                sortedRecordInfo = {
                    isSorted: true,
                    status: `Duplicate`,
                    filtererId: sortedrecord.filtererId
                };
                break;
            case `Rejected`:
            case `RejectedDuplicate`:
                sortedRecordInfo = {
                    isSorted: true,
                    status: `RejectedDuplicate`,
                    filtererId: sortedrecord.filtererId
                };
                break;
            default:
                sortedRecordInfo = {
                    isSorted: false
                };
                break;
        }

        if (this.isNameRequired(category)) {
            await DatabaseHelper.database.nominations.create({
                submitterId: submitterId,
                category: category,
                name: content.name,
                filterStatus: sortedRecordInfo.isSorted ? sortedRecordInfo.status : undefined,
                filtererId: sortedRecordInfo.isSorted ? sortedRecordInfo.filtererId : undefined
            });
        } else {
            if (this.isDiffCharRequired(category)) {
                await DatabaseHelper.database.nominations.create({
                    submitterId: submitterId,
                    service: service,
                    category: category,
                    bsrId: content.bsrId,
                    name: content.name,
                    difficulty: content.difficulty,
                    characteristic: content.characteristic,
                    filterStatus: sortedRecordInfo.isSorted ? sortedRecordInfo.status : undefined,
                    filtererId: sortedRecordInfo.isSorted ? sortedRecordInfo.filtererId : undefined
                });
            } else {
                await DatabaseHelper.database.nominations.create({
                    submitterId: submitterId,
                    service: service,
                    category: category,
                    bsrId: content.bsrId,
                    name: content.name,
                    filterStatus: sortedRecordInfo.isSorted ? sortedRecordInfo.status : undefined,
                    filtererId: sortedRecordInfo.isSorted ? sortedRecordInfo.filtererId : undefined
                });
            }
        }
        console.log(`Added nomination from ${submitterId} in category ${category}`);
        console.log(content);
        return NominationStatusResponse.Accepted;
    }

    public static async getNominationCount() : Promise<NominationCount[]> {
        const counts = {
            Total: await DatabaseHelper.database.nominations.count(),
            MapOfTheYear: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.MapOfTheYear } }),
            MapperOfTheYear: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.MapperOfTheYear } }),
            LighterOfTheYear: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.LighterOfTheYear } }),
            RookieMapperOfTheYear: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.RookieMapperOfTheYear } }),
            RookieLighterOfTheYear: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.RookieLighterOfTheYear } }),
            PackOfTheYear: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.PackOfTheYear } }),
            OSTMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.OST } }),
            AlternativeMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.AlternativeMap } }),
            FullSpreadMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.FullSpreadMap } }),
            Lightshow: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.Lightshow } }),
            Modchart: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.Modchart } }),
            ArtMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.ArtMap } }),
            RankedMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.RankedMap } }),
            BalancedMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.BalancedMap } }),
            TechMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.TechMap } }),
            SpeedMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.SpeedMap } }),
            DanceMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.DanceMap } }),
            FitnessMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.FitnessMap } }),
            ChallengeMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.ChallengeMap } }),
            AccMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.AccMap } }),
            PoodleMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.PoodleMap } }),
            GimmickMap: await DatabaseHelper.database.nominations.count({ where: { category: NominationCategory.GimmickMap } }),
        };

        const uniqueCategories = {
            MapOfTheYear: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.MapOfTheYear}, distinct: true, col: `bsrId` }),
            MapperOfTheYear: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.MapperOfTheYear}, distinct: true, col: `name` }),
            LighterOfTheYear: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.LighterOfTheYear}, distinct: true, col: `name` }),
            RookieMapperOfTheYear: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.RookieMapperOfTheYear}, distinct: true, col: `name` }),
            RookieLighterOfTheYear: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.RookieLighterOfTheYear}, distinct: true, col: `name` }),
            PackOfTheYear: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.PackOfTheYear}, distinct: true, col: `name` }),
            OSTMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.OST}, distinct: true, col: `name` }),
            AlternativeMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.AlternativeMap}, distinct: true, col: `bsrId` }),
            FullSpreadMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.FullSpreadMap}, distinct: true, col: `bsrId` }),
            Lightshow: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.Lightshow}, distinct: true, col: `bsrId` }),
            Modchart: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.Modchart}, distinct: true, col: `bsrId` }),
            ArtMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.ArtMap}, distinct: true, col: `bsrId` }),
            RankedMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.RankedMap}, distinct: true, col: `bsrId` }),
            BalancedMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.BalancedMap}, distinct: true, col: `bsrId` }),
            TechMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.TechMap}, distinct: true, col: `bsrId` }),
            SpeedMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.SpeedMap}, distinct: true, col: `bsrId` }),
            DanceMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.DanceMap}, distinct: true, col: `bsrId` }),
            FitnessMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.FitnessMap}, distinct: true, col: `bsrId` }),
            ChallengeMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.ChallengeMap}, distinct: true, col: `bsrId` }),
            AccMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.AccMap}, distinct: true, col: `bsrId` }),
            PoodleMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.PoodleMap}, distinct: true, col: `bsrId` }),
            GimmickMap: await DatabaseHelper.database.nominations.count({ where: {category: NominationCategory.GimmickMap}, distinct: true, col: `bsrId` }),
            Total: await DatabaseHelper.database.nominations.count({ distinct: true, col: `bsrId` }) + await DatabaseHelper.database.nominations.count({ distinct: true, col: `name` }),
        };

        // console.log(counts, uniqueCategories);
        return [counts, uniqueCategories];
    }

    public static isNameRequired(category: string): boolean {
        return category == NominationCategory.PackOfTheYear || category == NominationCategory.MapperOfTheYear || category == NominationCategory.LighterOfTheYear || category == NominationCategory.RookieMapperOfTheYear || category == NominationCategory.RookieLighterOfTheYear || category == NominationCategory.OST;
    }

    public static isDiffCharRequired(category: string): boolean {
        return category != NominationCategory.PackOfTheYear && category != NominationCategory.MapperOfTheYear && category != NominationCategory.LighterOfTheYear && category != NominationCategory.RookieMapperOfTheYear && category != NominationCategory.RookieLighterOfTheYear && category != NominationCategory.FullSpreadMap;
    }

    public static isNameRequiredSortedSubmission(category: string): boolean {
        return category == SortedSubmissionsCategory.PackOfTheYear || category == SortedSubmissionsCategory.MapperOfTheYear || category == SortedSubmissionsCategory.LighterOfTheYear || category == SortedSubmissionsCategory.RookieMapperOfTheYear || category == SortedSubmissionsCategory.RookieLighterOfTheYear || category == SortedSubmissionsCategory.OST;
    }

    public static isDiffCharRequiredSortedSubmission(category: string): boolean {
        return category != SortedSubmissionsCategory.PackOfTheYear && category != SortedSubmissionsCategory.MapperOfTheYear && category != SortedSubmissionsCategory.LighterOfTheYear && category != SortedSubmissionsCategory.RookieMapperOfTheYear && category != SortedSubmissionsCategory.RookieLighterOfTheYear && category != SortedSubmissionsCategory.FullSpreadMap && category != SortedSubmissionsCategory.OST;
    }
}

export type NominationCount = {
    Total: number;
    MapOfTheYear: number;
    MapperOfTheYear: number;
    LighterOfTheYear: number;
    RookieMapperOfTheYear: number;
    RookieLighterOfTheYear: number;
    PackOfTheYear: number;
    OSTMap: number;
    AlternativeMap: number;
    FullSpreadMap: number;
    Lightshow: number;
    Modchart: number;
    ArtMap: number;
    RankedMap: number;
    BalancedMap: number;
    TechMap: number;
    SpeedMap: number;
    DanceMap: number;
    FitnessMap: number;
    ChallengeMap: number;
    AccMap: number;
    PoodleMap: number;
    GimmickMap: number;
}

export enum NominationStatusResponse {
    Accepted,
    AlreadyVoted,
    InvalidCategory,
    Invalid
}
// #endregion

// yoink thankies bstoday
export function validateEnumValue(value: string | number, enumType: object): boolean {
    if (Object.values(enumType).includes(value)) {
        return true;
    }
    return false;
}

//SortedSubmissions
export class SortedSubmission extends Model<InferAttributes<SortedSubmission>, InferCreationAttributes<SortedSubmission>> {
    public id:number;
    public category:SortedSubmissionsCategory;
    public bsrId?:string;
    public name?:string;
    public difficulty?:string;
    public characteristic?:string;
    public hash?:string;
    public involvedMappers?:string[];
}

export class Judge extends Model<InferAttributes<Judge>, InferCreationAttributes<Judge>> {
    public id:number;
    public name:string;
    public roles:string[];
    public discordId:string;
    public avatarUrl:string;
    public beatSaverIds:string[];
    public permittedCategories:SortedSubmissionsCategory[];
}

export class JudgeVote extends Model<InferAttributes<JudgeVote>, InferCreationAttributes<JudgeVote>> {
    public id:number;
    public judgeId:number;
    public submissionId:number;
    public score:number;
    public notes?:string;
}

export enum SortedSubmissionsCategory {
    OST = `Gen-OST`,
    AlternativeMap = `Gen-Alternative`, //360,90,one saber, na
    FullSpreadMap = `Gen-FullSpread`,

    LightshowVanilla = `Lightshow-Vanilla`,
    LightshowVanillaPlus = `Lightshow-VanillaPlus`,
    LightshowChroma = `Lightshow-Chroma`,
    LightshowChromaPlus = `Lightshow-ChromaPlus`,

    Modchart = `Mods-Modchart`,
    ArtMap = `Mods-ArtMap`,

    RankedMapLower = `Ranked-RankedMapLower`,
    RankedMapHigher = `Ranked-RankedMapHigher`,

    BalancedMap = `Style-Balanced`,
    TechMap = `Style-Tech`,
    SpeedMap = `Style-Speed`,
    DanceMap = `Style-Dance`,
    FitnessMap = `Style-Fitness`,
    ChallengeMap = `Style-Challenge`,
    AccMap = `Style-Acc`,
    PoodleMap = `Style-Poodle`,
    GimmickMap = `Style-Gimmick`,

    PackOfTheYear = `OTY-Pack`,
    MapOfTheYear = `OTY-Map`,
    MapperOfTheYear = `OTY-Mapper`,
    LighterOfTheYear = `OTY-Lighter`,
    RookieLighterOfTheYear = `OTY-RookieLighter`,
    RookieMapperOfTheYear = `OTY-RookieMapper`,
}

export const SortedSubmissionsCategoryEnglish = {
    OST: [`Gen-OST`, `OST`],
    FullSpreadMap: [`Gen-FullSpread`, `Full Spread`],
    AlternativeMap: [`Gen-Alternative`, `Non-Standard`],

    LightshowVanilla: [`Lightshow-Vanilla`, `Lightshow Vanilla`],
    LightshowVanillaPlus: [`Lightshow-VanillaPlus`, `Lightshow Vanilla+`],
    LightshowChroma: [`Lightshow-Chroma`, `Lightshow Chroma`],
    LightshowChromaPlus: [`Lightshow-ChromaPlus`, `Lightshow Chroma+`],

    Modchart: [`Mods-Modchart`, `Modchart`],
    ArtMap: [`Mods-ArtMap`, `Art Map`],

    RankedMapLower: [`Ranked-RankedMapLower`, `Ranked-RankedMapLower`],
    RankedMapHigher: [`Ranked-RankedMapHigher`, `Ranked-RankedMapHigher`],

    BalancedMap: [`Style-Balanced`, `Balanced`],
    TechMap: [`Style-Tech`, `Tech`],
    SpeedMap: [`Style-Speed`, `Speed`],
    DanceMap: [`Style-Dance`, `Dance`],
    FitnessMap: [`Style-Fitness`, `Fitness`],
    ChallengeMap: [`Style-Challenge`, `Challenge`],
    AccMap: [`Style-Acc`, `Acc`],
    PoodleMap: [`Style-Poodle`, `Poodle`],
    GimmickMap: [`Style-Gimmick`, `Gimmick`],

    MapOfTheYear: [`OTY-Map`, `Map of the Year`],
    MapperOfTheYear: [`OTY-Mapper`, `Mapper of the Year`],
    LighterOfTheYear: [`OTY-Lighter`, `Lighter of the Year`],
    RookieMapperOfTheYear: [`OTY-RookieMapper`, `Rookie Mapper of the Year`],
    RookieLighterOfTheYear: [`OTY-RookieLighter`, `Rookie Lighter of the Year`],
    PackOfTheYear: [`OTY-Pack`, `Pack of the Year`],
};
/*
    Beasties Admin will go through the nominations and sort them into the correct categories & clean up data (if applicable) [NominationAttributes -> SortedSubmission]

    Judges will be assigned to categories and will be able to vote on the submissions [SortedSubmission -> JudgeVote]

    Judges need to be able to log in, will be using Discord OAuth2 for this since it's the easiest way to verify users are who they say they are.
    Judges need to be given a role from Beasties Admin to be able to vote on a category. [Judges.role && Judges.permittedCategories]

    Judges will be required to list all of their BeatSaver IDs so that I know when to give their votes a bye. [Judges.beatSaverIds]
*/
