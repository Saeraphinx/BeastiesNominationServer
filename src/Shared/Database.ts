import path from "path";
import { exit } from "process";
import { DataTypes, InferAttributes, InferCreationAttributes, Model, ModelStatic, Sequelize } from "sequelize";
import { storage } from '../../storage/config.json';

export class DatabaseManager {
    public sequelize: Sequelize;
    public nominations: ModelStatic<NominationAttributes>;

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
        this.nominations = this.sequelize.define(`nominations`, {
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
        });
    }
}

export class NominationAttributes extends Model<InferAttributes<NominationAttributes>, InferCreationAttributes<NominationAttributes>> {
    public nominationId: number;
    public submitterId: string;
    public service: `beatleader` | `beatsaver`;
    public bsrId: string;
    public name: string;
    public difficulty: Difficulty;
    public characteristic: Characteristic;
    public category: string;
}

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
    private static database: DatabaseManager;

    constructor(db: DatabaseManager) {
        DatabaseHelper.database = db;
    }

    public static async addNomination(submitterId: string, service:`beatleader`|`beatsaver`, category: string, content: {
        bsrId?: string,
        name?: string,
        difficulty?: Difficulty,
        characteristic?: Characteristic,
    }): Promise<NominationStatusResponse> {
        let existingRecords;
        if (this.isNameRequired(category)) {
            existingRecords = await DatabaseHelper.database.nominations.findAndCountAll({ where: { submitterId: submitterId, name: content.name, category: category } });
        } else {
            if (this.isDiffCharRequired(category)) {
                existingRecords = await DatabaseHelper.database.nominations.findAndCountAll({ where: { submitterId: submitterId, bsrId: content.bsrId, category: category, difficulty: content.difficulty, characteristic: content.characteristic } });
            } else {
                existingRecords = await DatabaseHelper.database.nominations.findAndCountAll({ where: { submitterId: submitterId, bsrId: content.bsrId, category: category } });
            }
        }

        if (existingRecords.count > 0) {
            return NominationStatusResponse.AlreadyVoted;
        }

        if (!validateEnumValue(category, NominationCategory)) {
            return NominationStatusResponse.InvalidCategory;
        }

        if (this.isNameRequired(category)) {
            await DatabaseHelper.database.nominations.create({
                submitterId: submitterId,
                category: category,
                name: content.name,
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
                });
            } else {
                await DatabaseHelper.database.nominations.create({
                    submitterId: submitterId,
                    service: service,
                    category: category,
                    bsrId: content.bsrId,
                    name: content.name,
                });
            }
        }
        console.log(`Added nomination from ${submitterId} in category ${category}`);
        console.log(content);
        return NominationStatusResponse.Accepted;
    }

    public static async getNominationCount() : Promise<NominationCount> {
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
        return counts;
    }

    public static isNameRequired(category: string): boolean {
        return category == NominationCategory.PackOfTheYear || category == NominationCategory.MapperOfTheYear || category == NominationCategory.LighterOfTheYear || category == NominationCategory.RookieMapperOfTheYear || category == NominationCategory.RookieLighterOfTheYear || category == NominationCategory.OST;
    }

    public static isDiffCharRequired(category: string): boolean {
        return category != NominationCategory.PackOfTheYear && category != NominationCategory.MapperOfTheYear && category != NominationCategory.LighterOfTheYear && category != NominationCategory.RookieMapperOfTheYear && category != NominationCategory.RookieLighterOfTheYear && category != NominationCategory.FullSpreadMap;
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

// yoink thankies bstoday
export function validateEnumValue(value: string | number, enumType: object): boolean {
    if (Object.values(enumType).includes(value)) {
        return true;
    }
    return false;
}