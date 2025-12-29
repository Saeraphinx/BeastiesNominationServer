import path from "path";
import { exit } from "process";
import { DataTypes, InferAttributes, InferCreationAttributes, Model, ModelStatic, Op, Sequelize } from "sequelize";
import { storage } from '../../storage/config.json';
import { Logger } from "./Logger";
import { create } from "domain";

export class DatabaseManager {
    public sequelize: Sequelize;
    public submissions: ModelStatic<SubmissionAttributes>;
    public sortedSubmissions: ModelStatic<SortedSubmission>;
    public judges: ModelStatic<Judge>;
    public judgeVotes: ModelStatic<JudgeVote>;
    public publicVotes: ModelStatic<PublicVote>;

    constructor() {
        this.sequelize = new Sequelize(`database`, `user`, `password`, {
            host: `localhost`,
            dialect: `sqlite`,
            logging: false,
            storage: path.resolve(storage.database),
        });

        Logger.log(`Loading Database...`);
        this.loadTables();
        this.sequelize.sync().then(() => {
            Logger.log(`Database Loaded.`);
            new DatabaseHelper(this);
            DatabaseHelper.database.sequelize.query(`PRAGMA integrity_check;`).then((healthcheck) => {
                let healthcheckString = (healthcheck[0][0] as any).integrity_check;
                Logger.log(`Database health check: ${healthcheckString}`);
            }).catch((error) => {
                Logger.error(`Error checking database health: ${error}`);
            });
            setInterval(() => {
                DatabaseHelper.database.sequelize.query(`PRAGMA integrity_check;`).then((healthcheck) => {
                    let healthcheckString = (healthcheck[0][0] as any).integrity_check;
                    Logger.log(`Database health check: ${healthcheckString}`);
                }).catch((error) => {
                    Logger.error(`Error checking database health: ${error}`);
                });
            }, 1000 * 60 * 60 * 1);
        }).catch((error) => {
            Logger.error(`Error loading database: ${error}`);
            exit(-1);
        });
    }

    private loadTables() {
        this.submissions = this.sequelize.define<SubmissionAttributes>(`submissions`, {
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
        }, {
            paranoid: true,
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
        }, {
            paranoid: true,
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
        }, {
            paranoid: true,
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
                allowNull: true,
            },
            notes: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE,
        }, {
            paranoid: true,
        });

        this.publicVotes = this.sequelize.define<PublicVote>(`publicVotes`, {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            service: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            userId: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            voteRecord: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            score: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            category: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            linkedId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        }, {
            paranoid: true,
        });
    }
}


export class SubmissionAttributes extends Model<InferAttributes<SubmissionAttributes>, InferCreationAttributes<SubmissionAttributes>> {
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
export type FilterStatus = `Accepted` | `Rejected` | `Duplicate` | `RejectedDuplicate` | `Ignored`;

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

export enum SubmissionCategory {
    OST = `Gen-OST`,
    NonStandardMap = `Gen-NonStandard`, //360,90,one saber, na
    FullSpreadMap = `Gen-FullSpread`,

    Lightshow = `Mods-Lightshow`,
    GameplayModchart = `Mods-GameplayModchart`,

    RankedMap = `Ranked-RankedMap`,

    BalancedMap = `Style-Balanced`,
    TechMap = `Style-Tech`,
    SpeedMap = `Style-Speed`,
    DanceMap = `Style-Dance`,
    FitnessMap = `Style-Fitness`,
    ChallengeMap = `Style-Challenge`,
    AccMap = `Style-Acc`,
    PoodleMap = `Style-Poodle`,
    WildcardMap = `Style-Wildcard`,

    PackOfTheYear = `OTY-Pack`,
    MapOfTheYear = `OTY-Map`,
    ModdedMapOfTheYear = `OTY-ModdedMap`,
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

    public static async addSubmission(submitterId: string, service:`beatleader`|`beatsaver`|`judgeId`, category: string, content: {
        bsrId?: string,
        name?: string,
        difficulty?: Difficulty,
        characteristic?: Characteristic,
    }): Promise<NominationStatusResponse> {
        let existingRecords;
        let sortedrecord: SubmissionAttributes;
        if (this.isNameRequired(category)) {
            existingRecords = await DatabaseHelper.database.submissions.findAndCountAll({ where: { submitterId: submitterId, name: content.name, category: category } });
            sortedrecord = await DatabaseHelper.database.submissions.findOne({where: { category: category, name: content.name, filterStatus: {[Op.not]: null}}});
        } else {
            if (this.isDiffCharRequired(category)) {
                existingRecords = await DatabaseHelper.database.submissions.findAndCountAll({ where: { submitterId: submitterId, bsrId: content.bsrId, category: category, difficulty: content.difficulty, characteristic: content.characteristic } });
                sortedrecord = await DatabaseHelper.database.submissions.findOne({where: {bsrId: content.bsrId, category: category, characteristic: content.characteristic, difficulty: content.difficulty, filterStatus: {[Op.not]: null}}});
            } else {
                existingRecords = await DatabaseHelper.database.submissions.findAndCountAll({ where: { submitterId: submitterId, bsrId: content.bsrId, category: category } });
                sortedrecord = await DatabaseHelper.database.submissions.findOne({where: { bsrId: content.bsrId, category: category, filterStatus: {[Op.not]: null} }});
            }
        }

        if (existingRecords.count > 0) {
            return NominationStatusResponse.AlreadyVoted;
        }

        if (!validateEnumValue(category, SubmissionCategory)) {
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
            case `Ignored`:
            default:
                sortedRecordInfo = {
                    isSorted: false
                };
                break;
        }

        if (this.isNameRequired(category)) {
            await DatabaseHelper.database.submissions.create({
                submitterId: submitterId,
                category: category,
                name: content.name,
                filterStatus: sortedRecordInfo.isSorted ? sortedRecordInfo.status : undefined,
                filtererId: sortedRecordInfo.isSorted ? sortedRecordInfo.filtererId : undefined
            });
        } else {
            if (this.isDiffCharRequired(category)) {
                await DatabaseHelper.database.submissions.create({
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
                await DatabaseHelper.database.submissions.create({
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
            Total: await DatabaseHelper.database.submissions.count(),
            MapOfTheYear: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.MapOfTheYear } }),
            MapperOfTheYear: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.MapperOfTheYear } }),
            LighterOfTheYear: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.LighterOfTheYear } }),
            RookieMapperOfTheYear: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.RookieMapperOfTheYear } }),
            RookieLighterOfTheYear: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.RookieLighterOfTheYear } }),
            PackOfTheYear: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.PackOfTheYear } }),
            OSTMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.OST } }),
            NonStandardMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.NonStandardMap } }),
            FullSpreadMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.FullSpreadMap } }),
            Lightshow: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.Lightshow } }),
            GameplayModchart: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.GameplayModchart } }),
            RankedMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.RankedMap } }),
            BalancedMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.BalancedMap } }),
            TechMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.TechMap } }),
            SpeedMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.SpeedMap } }),
            DanceMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.DanceMap } }),
            FitnessMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.FitnessMap } }),
            ChallengeMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.ChallengeMap } }),
            AccMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.AccMap } }),
            PoodleMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.PoodleMap } }),
            WildcardMap: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.WildcardMap } }),
            ModdedMapOfTheYear: await DatabaseHelper.database.submissions.count({ where: { category: SubmissionCategory.ModdedMapOfTheYear } }),
        };

        const uniqueCategories = {
            MapOfTheYear: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.MapOfTheYear}, distinct: true, col: `bsrId` }),
            MapperOfTheYear: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.MapperOfTheYear}, distinct: true, col: `name` }),
            LighterOfTheYear: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.LighterOfTheYear}, distinct: true, col: `name` }),
            RookieMapperOfTheYear: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.RookieMapperOfTheYear}, distinct: true, col: `name` }),
            RookieLighterOfTheYear: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.RookieLighterOfTheYear}, distinct: true, col: `name` }),
            PackOfTheYear: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.PackOfTheYear}, distinct: true, col: `name` }),
            OSTMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.OST}, distinct: true, col: `name` }),
            NonStandardMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.NonStandardMap}, distinct: true, col: `bsrId` }),
            FullSpreadMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.FullSpreadMap}, distinct: true, col: `bsrId` }),
            Lightshow: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.Lightshow}, distinct: true, col: `bsrId` }),
            GameplayModchart: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.GameplayModchart}, distinct: true, col: `bsrId` }),
            RankedMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.RankedMap}, distinct: true, col: `bsrId` }),
            BalancedMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.BalancedMap}, distinct: true, col: `bsrId` }),
            TechMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.TechMap}, distinct: true, col: `bsrId` }),
            SpeedMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.SpeedMap}, distinct: true, col: `bsrId` }),
            DanceMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.DanceMap}, distinct: true, col: `bsrId` }),
            FitnessMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.FitnessMap}, distinct: true, col: `bsrId` }),
            ChallengeMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.ChallengeMap}, distinct: true, col: `bsrId` }),
            AccMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.AccMap}, distinct: true, col: `bsrId` }),
            PoodleMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.PoodleMap}, distinct: true, col: `bsrId` }),
            WildcardMap: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.WildcardMap}, distinct: true, col: `bsrId` }),
            ModdedMapOfTheYear: await DatabaseHelper.database.submissions.count({ where: {category: SubmissionCategory.ModdedMapOfTheYear}, distinct: true, col: `bsrId` }),
            Total: await DatabaseHelper.database.submissions.count({ distinct: true, col: `bsrId` }) + await DatabaseHelper.database.submissions.count({ distinct: true, col: `name` }),
        };

        // console.log(counts, uniqueCategories);
        return [counts, uniqueCategories];
    }

    public static isNameRequired(category: string): boolean {
        return category == SubmissionCategory.PackOfTheYear || category == SubmissionCategory.MapperOfTheYear || category == SubmissionCategory.LighterOfTheYear || category == SubmissionCategory.RookieMapperOfTheYear || category == SubmissionCategory.RookieLighterOfTheYear || category == SubmissionCategory.OST;
    }

    public static isDiffCharRequired(category: string): boolean {
        return category != SubmissionCategory.PackOfTheYear && category != SubmissionCategory.MapperOfTheYear && category != SubmissionCategory.LighterOfTheYear && category != SubmissionCategory.RookieMapperOfTheYear && category != SubmissionCategory.RookieLighterOfTheYear && category != SubmissionCategory.FullSpreadMap;
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
    ModdedMapOfTheYear: number;
    LighterOfTheYear: number;
    RookieMapperOfTheYear: number;
    RookieLighterOfTheYear: number;
    PackOfTheYear: number;
    OSTMap: number;
    NonStandardMap: number;
    FullSpreadMap: number;
    Lightshow: number;
    GameplayModchart: number;
    //ArtMap: number;
    RankedMap: number;
    BalancedMap: number;
    TechMap: number;
    SpeedMap: number;
    DanceMap: number;
    FitnessMap: number;
    ChallengeMap: number;
    AccMap: number;
    PoodleMap: number;
    WildcardMap: number;
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
    declare readonly createdAt:string;
    declare readonly updatedAt:string;
}

export class PublicVote extends Model<InferAttributes<PublicVote>, InferCreationAttributes<PublicVote>> {
    declare readonly id:number;
    declare service:string;
    declare userId:string;
    declare score: number|null;
    declare voteRecord:string|null;
    declare category:SortedSubmissionsCategory;
    declare linkedId:string|null;
}

// #region SortedSubmissionsCategory
export enum SortedSubmissionsCategory {
    OST = `Gen-OST`,
    NonStandardMap = `Gen-NonStandard`, //360,90,one saber, na
    FullSpreadMap = `Gen-FullSpread`,

    LightshowVanilla = `Lightshow-Vanilla`,
    LightshowVanillaPlus = `Lightshow-VanillaPlus`,
    LightshowChroma = `Lightshow-Chroma`,
    LightshowChromaPlus = `Lightshow-ChromaPlus`,
    LightshowVivify = `Lightshow-Vivify`,

    Modchart = `Mods-GameplayModchart`,
    //ArtMap = `Mods-ArtMap`,

    RankedMapBLLessThan8= `Ranked-BLLessThan8`,
    RankedMapBL8To12 = `Ranked-BL8To12`,
    RankedMapBL12Plus = `Ranked-BL12Plus`,
    RankedMapSSLessThan8 = `Ranked-SSLessThan8`,
    RankedMapSS8To12 = `Ranked-SS8To12`,
    RankedMapSS12Plus = `Ranked-SS12Plus`,

    BalancedMap = `Style-Balanced`,
    LowTechMap = `Style-LowTech`,
    HighTechMap = `Style-HighTech`,
    SpeedMap = `Style-Speed`,
    DanceMap = `Style-Dance`,
    FitnessMap = `Style-Fitness`,
    ChallengeMap = `Style-Challenge`,
    AccMap = `Style-Acc`,
    PoodleMap = `Style-Poodle`,
    WildcardMap = `Style-Wildcard`,

    PackOfTheYear = `OTY-Pack`,
    MapOfTheYear = `OTY-Map`,
    ModdedMapOfTheYear = `OTY-ModdedMap`,
    MapperOfTheYear = `OTY-Mapper`,
    LighterOfTheYear = `OTY-Lighter`,
    RookieLighterOfTheYear = `OTY-RookieLighter`,
    RookieMapperOfTheYear = `OTY-RookieMapper`,
}

export const SortedSubmissionsCategoryEnglish = {
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
    PackOfTheYear: [`OTY-Pack`, `Pack of the Year`],
};
/*
    Beasties Admin will go through the nominations and sort them into the correct categories & clean up data (if applicable) [NominationAttributes -> SortedSubmission]

    Judges will be assigned to categories and will be able to vote on the submissions [SortedSubmission -> JudgeVote]

    Judges need to be able to log in, will be using Discord OAuth2 for this since it's the easiest way to verify users are who they say they are.
    Judges need to be given a role from Beasties Admin to be able to vote on a category. [Judges.role && Judges.permittedCategories]

    Judges will be required to list all of their BeatSaver IDs so that I know when to give their votes a bye. [Judges.beatSaverIds]
*/
