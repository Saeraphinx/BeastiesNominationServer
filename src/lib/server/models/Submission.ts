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

    public static validateSubmission(
        content: {
            category: SubmissionCategory,
            bsrId?: string;
            name?: string;
            difficulty?: Difficulty;
            characteristic?: Characteristic;
        }
    ): RequestSubmissionStatus {
        let isName = isNameRequired(content.category)
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

                // from 270436 (42063) to 313841 (4c9f1) are eligible, except for RankedMap which has no restrictions
                if (
                    (bsrIdNoHex <= 270435 || bsrIdNoHex >= 313841) &&
                    content.category != SubmissionCategory.RankedMap
                ) {
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
            category: string,
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
            category: string,
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
                where: { submitterId: submitterId, name: content.name, category: content.category }
            });
            sortedrecord = await this.findOne({
                where: { category: content.category, name: content.name, filterStatus: { [Op.not]: null } }
            });
        } else {
            if (isDiffCharRequired(content.category)) {
                existingRecords = await this.findAndCountAll({
                    where: {
                        submitterId: submitterId,
                        bsrId: content.bsrId,
                        category: content.category,
                        difficulty: content.difficulty,
                        characteristic: content.characteristic
                    }
                });
                sortedrecord = await this.findOne({
                    where: {
                        bsrId: content.bsrId,
                        category: content.category,
                        characteristic: content.characteristic,
                        difficulty: content.difficulty,
                        filterStatus: { [Op.not]: null }
                    }
                });
            } else {
                existingRecords = await this.findAndCountAll({
                    where: { submitterId: submitterId, bsrId: content.bsrId, category: content.category }
                });
                sortedrecord = await this.findOne({
                    where: { bsrId: content.bsrId, category: content.category, filterStatus: { [Op.not]: null } }
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
                filtererId: sortedRecordInfo.isSorted ? sortedRecordInfo.filtererId : null
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
                    filtererId: sortedRecordInfo.isSorted ? sortedRecordInfo.filtererId : null
                });
            } else {
                await this.create({
                    submitterId: submitterId,
                    service: service,
                    category: content.category,
                    bsrId: content.bsrId,
                    name: content.name,
                    filterStatus: sortedRecordInfo.isSorted ? sortedRecordInfo.status : null,
                    filtererId: sortedRecordInfo.isSorted ? sortedRecordInfo.filtererId : null
                });
            }
        }
        console.log(`Added nomination from ${submitterId} in category ${content.category}`);
        console.log(content);
        return NominationStatusResponse.Accepted;
    }

    public static async getNominationCount() {
        const counts = {
            Total: await this.count(),
            MapOfTheYear: await this.count({
                where: { category: SubmissionCategory.MapOfTheYear }
            }),
            MapperOfTheYear: await this.count({
                where: { category: SubmissionCategory.MapperOfTheYear }
            }),
            LighterOfTheYear: await this.count({
                where: { category: SubmissionCategory.LighterOfTheYear }
            }),
            RookieMapperOfTheYear: await this.count({
                where: { category: SubmissionCategory.RookieMapperOfTheYear }
            }),
            RookieLighterOfTheYear: await this.count({
                where: { category: SubmissionCategory.RookieLighterOfTheYear }
            }),
            PackOfTheYear: await this.count({
                where: { category: SubmissionCategory.PackOfTheYear }
            }),
            OSTMap: await this.count({
                where: { category: SubmissionCategory.OST }
            }),
            NonStandardMap: await this.count({
                where: { category: SubmissionCategory.NonStandardMap }
            }),
            FullSpreadMap: await this.count({
                where: { category: SubmissionCategory.FullSpreadMap }
            }),
            Lightshow: await this.count({
                where: { category: SubmissionCategory.Lightshow }
            }),
            GameplayModchart: await this.count({
                where: { category: SubmissionCategory.GameplayModchart }
            }),
            RankedMap: await this.count({
                where: { category: SubmissionCategory.RankedMap }
            }),
            BalancedMap: await this.count({
                where: { category: SubmissionCategory.BalancedMap }
            }),
            TechMap: await this.count({
                where: { category: SubmissionCategory.TechMap }
            }),
            SpeedMap: await this.count({
                where: { category: SubmissionCategory.SpeedMap }
            }),
            DanceMap: await this.count({
                where: { category: SubmissionCategory.DanceMap }
            }),
            FitnessMap: await this.count({
                where: { category: SubmissionCategory.FitnessMap }
            }),
            ChallengeMap: await this.count({
                where: { category: SubmissionCategory.ChallengeMap }
            }),
            AccMap: await this.count({
                where: { category: SubmissionCategory.AccMap }
            }),
            PoodleMap: await this.count({
                where: { category: SubmissionCategory.PoodleMap }
            }),
            WildcardMap: await this.count({
                where: { category: SubmissionCategory.WildcardMap }
            }),
            ModdedMapOfTheYear: await this.count({
                where: { category: SubmissionCategory.ModdedMapOfTheYear }
            })
        };

        const uniqueCategories = {
            MapOfTheYear: await this.count({
                where: { category: SubmissionCategory.MapOfTheYear },
                distinct: true,
                col: `bsrId`
            }),
            MapperOfTheYear: await this.count({
                where: { category: SubmissionCategory.MapperOfTheYear },
                distinct: true,
                col: `name`
            }),
            LighterOfTheYear: await this.count({
                where: { category: SubmissionCategory.LighterOfTheYear },
                distinct: true,
                col: `name`
            }),
            RookieMapperOfTheYear: await this.count({
                where: { category: SubmissionCategory.RookieMapperOfTheYear },
                distinct: true,
                col: `name`
            }),
            RookieLighterOfTheYear: await this.count({
                where: { category: SubmissionCategory.RookieLighterOfTheYear },
                distinct: true,
                col: `name`
            }),
            PackOfTheYear: await this.count({
                where: { category: SubmissionCategory.PackOfTheYear },
                distinct: true,
                col: `name`
            }),
            OSTMap: await this.count({
                where: { category: SubmissionCategory.OST },
                distinct: true,
                col: `name`
            }),
            NonStandardMap: await this.count({
                where: { category: SubmissionCategory.NonStandardMap },
                distinct: true,
                col: `bsrId`
            }),
            FullSpreadMap: await this.count({
                where: { category: SubmissionCategory.FullSpreadMap },
                distinct: true,
                col: `bsrId`
            }),
            Lightshow: await this.count({
                where: { category: SubmissionCategory.Lightshow },
                distinct: true,
                col: `bsrId`
            }),
            GameplayModchart: await this.count({
                where: { category: SubmissionCategory.GameplayModchart },
                distinct: true,
                col: `bsrId`
            }),
            RankedMap: await this.count({
                where: { category: SubmissionCategory.RankedMap },
                distinct: true,
                col: `bsrId`
            }),
            BalancedMap: await this.count({
                where: { category: SubmissionCategory.BalancedMap },
                distinct: true,
                col: `bsrId`
            }),
            TechMap: await this.count({
                where: { category: SubmissionCategory.TechMap },
                distinct: true,
                col: `bsrId`
            }),
            SpeedMap: await this.count({
                where: { category: SubmissionCategory.SpeedMap },
                distinct: true,
                col: `bsrId`
            }),
            DanceMap: await this.count({
                where: { category: SubmissionCategory.DanceMap },
                distinct: true,
                col: `bsrId`
            }),
            FitnessMap: await this.count({
                where: { category: SubmissionCategory.FitnessMap },
                distinct: true,
                col: `bsrId`
            }),
            ChallengeMap: await this.count({
                where: { category: SubmissionCategory.ChallengeMap },
                distinct: true,
                col: `bsrId`
            }),
            AccMap: await this.count({
                where: { category: SubmissionCategory.AccMap },
                distinct: true,
                col: `bsrId`
            }),
            PoodleMap: await this.count({
                where: { category: SubmissionCategory.PoodleMap },
                distinct: true,
                col: `bsrId`
            }),
            WildcardMap: await this.count({
                where: { category: SubmissionCategory.WildcardMap },
                distinct: true,
                col: `bsrId`
            }),
            ModdedMapOfTheYear: await this.count({
                where: { category: SubmissionCategory.ModdedMapOfTheYear },
                distinct: true,
                col: `bsrId`
            }),
            Total:
                (await this.count({ distinct: true, col: `bsrId` })) +
                (await this.count({ distinct: true, col: `name` }))
        };

        // console.log(counts, uniqueCategories);
        return [counts, uniqueCategories];
    }
}
