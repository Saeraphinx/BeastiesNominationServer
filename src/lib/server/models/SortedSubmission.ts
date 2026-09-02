import { AllowNull, Column, CreatedAt, DataType, Default, DeletedAt, Model, UpdatedAt } from "sequelize-typescript";
import type { Characteristic, Difficulty, SortedSubmissionsCategory } from "../../shared/goodies";
import type { InferAttributes,CreationOptional, InferCreationAttributes } from "sequelize";

export class SortedSubmission extends Model<InferAttributes<SortedSubmission>, InferCreationAttributes<SortedSubmission>> {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: CreationOptional<number>;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare category: SortedSubmissionsCategory;

    @AllowNull(true)
    @Default(null)
    @Column(DataType.STRING)
    declare bsrId: CreationOptional<string | null>;

    @AllowNull(true)
    @Default(null)
    @Column(DataType.STRING)
    declare name: CreationOptional<string | null>;

    @AllowNull(true)
    @Default(null)
    @Column(DataType.STRING)
    declare difficulty: CreationOptional<Difficulty | null>;

    @AllowNull(true)
    @Default(null)
    @Column(DataType.STRING)
    declare characteristic: CreationOptional<Characteristic | null>;

    @AllowNull(true)
    @Default(null)
    @Column(DataType.STRING)
    declare hash: CreationOptional<string | null>;

    @AllowNull(false)
    @Default([])
    @Column(DataType.ARRAY(DataType.STRING))
    declare submitterIds: string[];

    @CreatedAt
    declare createdAt: CreationOptional<Date>;
    @UpdatedAt
    declare updatedAt: CreationOptional<Date>;
    @DeletedAt
    declare deletedAt: CreationOptional<Date | null>;
}
