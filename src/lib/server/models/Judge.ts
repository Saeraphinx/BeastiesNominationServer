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

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: `[]`,
        get: function() {
            return JSON.parse(this.getDataValue(`roles`) || `[]`);
        },
        set: function(value: string[]) {
            this.setDataValue(`roles`, JSON.stringify(value));
        }
    })
    declare roles: CreationOptional<string[]>;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare discordId: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare avatarUrl: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: `[]`,
        get: function() {
            return JSON.parse(this.getDataValue(`beatSaverIds`) || `[]`);
        },
        set: function(value: string[]) {
            this.setDataValue(`beatSaverIds`, JSON.stringify(value));
        }
    })
    declare beatSaverIds: CreationOptional<string[]>;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: `[]`,
        get: function() {
            return JSON.parse(this.getDataValue(`permittedCategories`) || `[]`);
        },
        set: function(value: string[]) {
            this.setDataValue(`permittedCategories`, JSON.stringify(value));
        }
    })
    declare permittedCategories: CreationOptional<string[]>;

    @CreatedAt
    declare createdAt: CreationOptional<Date>;
    @UpdatedAt
    declare updatedAt: CreationOptional<Date>;
    @DeletedAt
    declare deletedAt: CreationOptional<Date | null>;
}