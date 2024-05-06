import path from "path";
import { exit } from "process";
import { DataTypes, InferAttributes, InferCreationAttributes, Model, ModelStatic, Sequelize } from "sequelize";
//@ts-ignore
import { storage } from '../../storage/config.json';
import { Logger } from "./Logger";

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
    public category: string;

    /**
     * test
     */
    public test() {
        
    }
}

export class DatabaseHelper {
    private static database: DatabaseManager;
    

    constructor(db: DatabaseManager) {
        DatabaseHelper.database = db;
    }

    public static async addNomination(submitterId: string, bsrId: string, category: string) {
        let existingRecords = await DatabaseHelper.database.nominations.findAndCountAll({ where: {submitterId : submitterId, bsrId: bsrId, category: category}})
        
        if (existingRecords.count > 0) {
            return null;
        }

        return await DatabaseHelper.database.nominations.create({
            submitterId: submitterId,
            bsrId: bsrId,
            category: category,
        });
    }
}