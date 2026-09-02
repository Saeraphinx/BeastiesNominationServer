import type { CreationOptional, InferAttributes, InferCreationAttributes } from "sequelize";
import { AllowNull, Column, CreatedAt, DataType, DeletedAt, Model, UpdatedAt } from "sequelize-typescript";

export class JudgeVote extends Model<InferAttributes<JudgeVote>, InferCreationAttributes<JudgeVote>> {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: CreationOptional<number>;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare judgeId: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare submissionId: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare score: string;

    @CreatedAt
    declare createdAt: CreationOptional<Date>;
    @UpdatedAt
    declare updatedAt: CreationOptional<Date>
    @DeletedAt
    declare deletedAt: CreationOptional<Date | null>;
}