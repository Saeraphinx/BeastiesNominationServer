import { Op, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute } from "sequelize";
import { AllowNull, Column, CreatedAt, DataType, Default, DeletedAt, Model, PrimaryKey, Table, UpdatedAt } from "sequelize-typescript";
import { type Characteristic, type Difficulty, SubmissionCategory, type FilterStatus, isNameRequired, validateEnumValue, isDiffCharRequired, NominationStatusResponse, RequestSubmissionStatus, CharacteristicEnum } from "../../shared/goodies";

@Table({
    tableName: "submissions",
    timestamps: true,
    paranoid: true,
})
export class Submission extends Model<InferAttributes<Submission>, InferCreationAttributes<Submission>> {
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    })
    declare nominationId: CreationOptional<number>;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare submitterId: string;

    @AllowNull(true)
    @Column(DataType.STRING)
    declare service: `beatleader` | `beatsaver` | `judgeId`;

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

    @AllowNull(false)
    @Column(DataType.STRING)
    declare category: SubmissionCategory;

    @AllowNull(true)
    @Default(null)
    @Column(DataType.STRING)
    declare filterStatus: CreationOptional<FilterStatus | null>;

    @AllowNull(true)
    @Default(null)
    @Column(DataType.STRING)
    declare filtererId: CreationOptional<string | null>; // if not null, this nomination was filtered by the user mentioned here

    @CreatedAt
    declare createdAt: CreationOptional<Date>;
    @UpdatedAt
    declare updatedAt: CreationOptional<Date>;
    @DeletedAt
    declare deletedAt: CreationOptional<Date | null>;

    private static recentSubmissions: NonAttribute<string[]> = [];

    public static validateSubmission(content: { category: SubmissionCategory; bsrId?: string; name?: string; difficulty?: Difficulty; characteristic?: Characteristic }): RequestSubmissionStatus {
        let isName = isNameRequired(content.category);
        let isDiffChar = isDiffCharRequired(content.category);

        if (isName) {
            if (content.bsrId || !content.name) {
                return RequestSubmissionStatus.Invalid;
            }

            if (content.characteristic || content.difficulty) {
                return RequestSubmissionStatus.Invalid;
            }

            if (!content.name || content.name.length == 0 || content.name.length > 100) {
                return RequestSubmissionStatus.Invalid;
            }

            if (content.name.match(/[a-zA-Z:\-_/0-9. ]{1,100}/) == null) {
                return RequestSubmissionStatus.Invalid;
            }

            this.recentSubmissions.push(content.name);
            if (this.recentSubmissions.filter((id) => id == content.name).length > 10) {
                return RequestSubmissionStatus.RateLimited;
            }
        } else {
            if (!content.bsrId || content.name) {
                return RequestSubmissionStatus.Invalid;
            }
            if (content.bsrId.length != 5) {
                return RequestSubmissionStatus.Invalid;
            }

            if (content.bsrId.match(/[0-9a-fA-FxX]{5}/) == null) {
                return RequestSubmissionStatus.Invalid;
            }

            if (content.bsrId.toLowerCase().includes(`x`) && content.category == SubmissionCategory.RankedMap) {
                content.bsrId = content.bsrId.toLowerCase().replaceAll(`x`, ``);
            } else {
                let bsrIdNoHex = parseInt(content.bsrId, 16);

                if (isNaN(bsrIdNoHex)) {
                    return RequestSubmissionStatus.Invalid;
                }

                // from 313841 (4c9f1) to ??? are eligible, except for RankedMap which has no restrictions
                if ((bsrIdNoHex <= 313842 || bsrIdNoHex >= 9999999) && content.category != SubmissionCategory.RankedMap) {
                    return RequestSubmissionStatus.OldKey;
                }
            }

            this.recentSubmissions.push(content.bsrId);
            if (this.recentSubmissions.filter((id) => id == content.bsrId).length > 10) {
                return RequestSubmissionStatus.RateLimited;
            }

            if (isDiffChar) {
                if (!content.difficulty || !content.characteristic) {
                    return RequestSubmissionStatus.Invalid;
                }
            }
        }

        return RequestSubmissionStatus.Success;
    }

    public static async sendSubmission(
        id: string,
        service: `beatleader` | `beatsaver` | `judgeId`,
        content: {
            category: string;
            bsrId?: string;
            name?: string;
            difficulty?: Difficulty;
            characteristic?: Characteristic;
        }
    ): Promise<RequestSubmissionStatus> {
        let status = await this.addSubmission(id, service, content);
        switch (status) {
            case NominationStatusResponse.Invalid:
                return RequestSubmissionStatus.Invalid;
            case NominationStatusResponse.InvalidCategory:
                return RequestSubmissionStatus.InvalidCategory;
            case NominationStatusResponse.AlreadyVoted:
                return RequestSubmissionStatus.AlreadyVoted;
            case NominationStatusResponse.Accepted:
                return RequestSubmissionStatus.Success;
        }
        // jsut in case
        return RequestSubmissionStatus.Invalid;
    }

    private static async addSubmission(
        submitterId: string,
        service: `beatleader` | `beatsaver` | `judgeId`,
        content: {
            category: string;
            bsrId?: string;
            name?: string;
            difficulty?: Difficulty;
            characteristic?: Characteristic;
        }
    ): Promise<NominationStatusResponse> {
        let existingRecords;
        let sortedrecord: Submission | null;
        if (isNameRequired(content.category)) {
            existingRecords = await this.findAndCountAll({
                where: { submitterId: submitterId, name: content.name, category: content.category },
            });
            sortedrecord = await this.findOne({
                where: { category: content.category, name: content.name, filterStatus: { [Op.not]: null } },
            });
        } else {
            if (isDiffCharRequired(content.category)) {
                existingRecords = await this.findAndCountAll({
                    where: {
                        submitterId: submitterId,
                        bsrId: content.bsrId,
                        category: content.category,
                        difficulty: content.difficulty,
                        characteristic: content.characteristic,
                    },
                });
                sortedrecord = await this.findOne({
                    where: {
                        bsrId: content.bsrId,
                        category: content.category,
                        characteristic: content.characteristic,
                        difficulty: content.difficulty,
                        filterStatus: { [Op.not]: null },
                    },
                });
            } else {
                existingRecords = await this.findAndCountAll({
                    where: { submitterId: submitterId, bsrId: content.bsrId, category: content.category },
                });
                sortedrecord = await this.findOne({
                    where: { bsrId: content.bsrId, category: content.category, filterStatus: { [Op.not]: null } },
                });
            }
        }

        if (existingRecords.count > 0) {
            return NominationStatusResponse.AlreadyVoted;
        }

        if (!validateEnumValue(content.category, SubmissionCategory)) {
            return NominationStatusResponse.InvalidCategory;
        }

        let sortedRecordInfo: { isSorted: boolean; status?: FilterStatus; filtererId?: string | null };
        sortedRecordInfo = { isSorted: false };
        switch (sortedrecord?.filterStatus) {
            case `Accepted`:
            case `Duplicate`:
                sortedRecordInfo = {
                    isSorted: true,
                    status: `Duplicate`,
                    filtererId: sortedrecord.filtererId,
                };
                break;
            case `Rejected`:
            case `RejectedDuplicate`:
                sortedRecordInfo = {
                    isSorted: true,
                    status: `RejectedDuplicate`,
                    filtererId: sortedrecord.filtererId,
                };
                break;
            case `Ignored`:
            default:
                sortedRecordInfo = {
                    isSorted: false,
                };
                break;
        }

        if (isNameRequired(content.category)) {
            if (!content.name) {
                return NominationStatusResponse.Invalid;
            }
            await this.create({
                submitterId: submitterId,
                category: content.category,
                name: content.name,
                service: service,
                filterStatus: sortedRecordInfo.isSorted ? sortedRecordInfo.status : null,
                filtererId: sortedRecordInfo.isSorted ? sortedRecordInfo.filtererId : null,
            });
        } else {
            if (isDiffCharRequired(content.category)) {
                await this.create({
                    submitterId: submitterId,
                    service: service,
                    category: content.category,
                    bsrId: content.bsrId,
                    name: content.name,
                    difficulty: content.difficulty,
                    characteristic: content.characteristic,
                    filterStatus: sortedRecordInfo.isSorted ? sortedRecordInfo.status : null,
                    filtererId: sortedRecordInfo.isSorted ? sortedRecordInfo.filtererId : null,
                });
            } else {
                await this.create({
                    submitterId: submitterId,
                    service: service,
                    category: content.category,
                    bsrId: content.bsrId,
                    name: content.name,
                    filterStatus: sortedRecordInfo.isSorted ? sortedRecordInfo.status : null,
                    filtererId: sortedRecordInfo.isSorted ? sortedRecordInfo.filtererId : null,
                });
            }
        }
        console.log(`Added nomination from ${submitterId} in category ${content.category}`);
        console.log(content);
        return NominationStatusResponse.Accepted;
    }

    private static async getCategoryCounts(catgegory: SubmissionCategory, distinct = false) {
        let isName = isNameRequired(catgegory) ? "name" : `bsrId`;
        return await this.count({
            where: { category: catgegory },
            distinct: distinct,
            col: distinct ? isName : undefined,
        });
    }

    public static async getNominationCount() {
        const counts: Record<SubmissionCategory | "Total", { total: number; distinct: number }> = {
            Total: {
                total: await this.count(),
                distinct: (await this.count({ distinct: true, col: `bsrId` })) + (await this.count({ distinct: true, col: `name` })),
            },
            [SubmissionCategory.OST]: {
                total: await this.getCategoryCounts(SubmissionCategory.OST),
                distinct: await this.getCategoryCounts(SubmissionCategory.OST, true),
            },
            [SubmissionCategory.NonStandardMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.NonStandardMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.NonStandardMap, true),
            },
            [SubmissionCategory.FullSpreadMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.FullSpreadMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.FullSpreadMap, true),
            },
            [SubmissionCategory.Lightshow]: {
                total: await this.getCategoryCounts(SubmissionCategory.Lightshow),
                distinct: await this.getCategoryCounts(SubmissionCategory.Lightshow, true),
            },
            [SubmissionCategory.GameplayModchart]: {
                total: await this.getCategoryCounts(SubmissionCategory.GameplayModchart),
                distinct: await this.getCategoryCounts(SubmissionCategory.GameplayModchart, true),
            },
            [SubmissionCategory.RankedMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.RankedMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.RankedMap, true),
            },
            [SubmissionCategory.BalancedMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.BalancedMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.BalancedMap, true),
            },
            [SubmissionCategory.TechMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.TechMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.TechMap, true),
            },
            [SubmissionCategory.SpeedMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.SpeedMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.SpeedMap, true),
            },
            [SubmissionCategory.DanceMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.DanceMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.DanceMap, true),
            },
            [SubmissionCategory.FitnessMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.FitnessMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.FitnessMap, true),
            },
            [SubmissionCategory.ChallengeMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.ChallengeMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.ChallengeMap, true),
            },
            [SubmissionCategory.AccMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.AccMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.AccMap, true),
            },
            [SubmissionCategory.PoodleMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.PoodleMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.PoodleMap, true),
            },
            [SubmissionCategory.WildcardMap]: {
                total: await this.getCategoryCounts(SubmissionCategory.WildcardMap),
                distinct: await this.getCategoryCounts(SubmissionCategory.WildcardMap, true),
            },
            [SubmissionCategory.MapperOfTheYear]: {
                total: await this.getCategoryCounts(SubmissionCategory.MapperOfTheYear),
                distinct: await this.getCategoryCounts(SubmissionCategory.MapperOfTheYear, true),
            },
            [SubmissionCategory.LighterOfTheYear]: {
                total: await this.getCategoryCounts(SubmissionCategory.LighterOfTheYear),
                distinct: await this.getCategoryCounts(SubmissionCategory.LighterOfTheYear, true),
            },
            [SubmissionCategory.RookieMapperOfTheYear]: {
                total: await this.getCategoryCounts(SubmissionCategory.RookieMapperOfTheYear),
                distinct: await this.getCategoryCounts(SubmissionCategory.RookieMapperOfTheYear, true),
            },
            [SubmissionCategory.RookieLighterOfTheYear]: {
                total: await this.getCategoryCounts(SubmissionCategory.RookieLighterOfTheYear),
                distinct: await this.getCategoryCounts(SubmissionCategory.RookieLighterOfTheYear, true),
            },
            [SubmissionCategory.PackOfTheYear]: {
                total: await this.getCategoryCounts(SubmissionCategory.PackOfTheYear),
                distinct: await this.getCategoryCounts(SubmissionCategory.PackOfTheYear, true),
            },
            [SubmissionCategory.ModdedMapOfTheYear]: {
                total: await this.getCategoryCounts(SubmissionCategory.ModdedMapOfTheYear),
                distinct: await this.getCategoryCounts(SubmissionCategory.ModdedMapOfTheYear, true),
            },
            [SubmissionCategory.MapOfTheYear]: {
                total: await this.getCategoryCounts(SubmissionCategory.MapOfTheYear),
                distinct: await this.getCategoryCounts(SubmissionCategory.MapOfTheYear, true),
            }
        };

        // console.log(counts, uniqueCategories);
        return counts;
    }
}
