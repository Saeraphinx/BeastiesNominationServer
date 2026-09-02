import type { CreationOptional, InferAttributes, InferCreationAttributes } from "sequelize";
import { AllowNull, Column, CreatedAt, DataType, Default, DeletedAt, Model, Table, UpdatedAt } from "sequelize-typescript";

@Table({
    tableName: "judges",
    timestamps: true,
    paranoid: true,
})
export class Judge extends Model<InferAttributes<Judge>, InferCreationAttributes<Judge>> {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    })
    declare judgeId: CreationOptional<number>;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare name: string;

    @AllowNull(false)
    @Default([])
    @Column(DataType.ARRAY(DataType.STRING))
    declare roles: CreationOptional<string[]>;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare discordId: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare avatarUrl: string;

    @AllowNull(false)
    @Default([])
    @Column(DataType.ARRAY(DataType.STRING))
    declare beatSaverIds: CreationOptional<string[]>;

    @AllowNull(false)
    @Default([])
    @Column(DataType.ARRAY(DataType.STRING))
    declare permittedCategories: CreationOptional<string[]>;

    @CreatedAt
    declare createdAt: CreationOptional<Date>;
    @UpdatedAt
    declare updatedAt: CreationOptional<Date>;
    @DeletedAt
    declare deletedAt: CreationOptional<Date | null>;
}