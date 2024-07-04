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
            bsrId: {
                type: DataTypes.STRING,
                allowNull: false,
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
    public bsrId: string;
    public difficulty: Difficulty;
    public characteristic: Characteristic;
    public category: string;
}

export type Difficulty = `Easy` | `Normal` | `Hard` | `Expert` | `ExpertPlus`;
export type Characteristic = `Standard` | `OneSaber` | `NoArrows` | `90Degree` | `360Degree` | `Lightshow` | `Lawless` | `Other`;

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

    public static async addNomination(submitterId: string, bsrId: string, category: string, difficulty?:Difficulty, characteristic?:Characteristic): Promise<NominationStatusResponse> {
        let existingRecords = await DatabaseHelper.database.nominations.findAndCountAll({ where: {submitterId : submitterId, bsrId: bsrId, category: category}});
        
        if (existingRecords.count > 0) {
            return NominationStatusResponse.AlreadyVoted;
        }

        if (!validateEnumValue(category, NominationCategory)) {
            return NominationStatusResponse.InvalidCategory;
        }

        await DatabaseHelper.database.nominations.create({
            submitterId: submitterId,
            bsrId: bsrId,
            difficulty: difficulty,
            characteristic: characteristic,
            category: category,
        });

        return NominationStatusResponse.Accepted;
    }
}

export enum NominationStatusResponse {
    Accepted,
    AlreadyVoted,
    InvalidCategory,
    Invalid
}

// yoink thankies bstoday
export function validateEnumValue(value:string|number, enumType:object):boolean {
    if (Object.values(enumType).includes(value)) {
        return true;
    }
    return false;
}