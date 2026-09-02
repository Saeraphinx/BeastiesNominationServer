import { type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";
import { AllowNull, Column, Default, DataType, Model, Table, CreatedAt, UpdatedAt, DeletedAt } from "sequelize-typescript";
import type { SortedSubmissionsCategory } from "../../shared/goodies";

@Table({
    tableName: "public_votes",
    timestamps: true,
    paranoid: true,
})
export class PublicVote extends Model<InferAttributes<PublicVote>, InferCreationAttributes<PublicVote>> {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: CreationOptional<number>;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare service: `beatleader` | `beatsaver` | `judgeId`;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare userId: string;

    @AllowNull(true)
    @Column(DataType.STRING)
    declare voteRecord: string | null;

    @AllowNull(true)
    @Default(null)
    @Column(DataType.INTEGER)
    declare score: CreationOptional<number | null>;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare category: SortedSubmissionsCategory;

    @CreatedAt
    declare createdAt: CreationOptional<Date>;
    @UpdatedAt
    declare updatedAt: CreationOptional<Date>;
    @DeletedAt
    declare deletedAt: CreationOptional<Date | null>;

}