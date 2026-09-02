import { randomBytes } from "crypto";

export type Difficulty = `Easy` | `Normal` | `Hard` | `Expert` | `ExpertPlus` | `All`;
export enum DifficultyEnum {
    Easy = `Easy`,
    Normal = `Normal`,
    Hard = `Hard`,
    Expert = `Expert`,
    ExpertPlus = `ExpertPlus`,
    All = `All`,
    Other = `Other`
}
export type Characteristic =
    | `Standard`
    | `OneSaber`
    | `NoArrows`
    | `90Degree`
    | `360Degree`
    | `Lightshow`
    | `Lawless`
    | `Other`
    | `All`;
export type FilterStatus = `Accepted` | `Rejected` | `Duplicate` | `RejectedDuplicate` | `Ignored`;

export enum CharacteristicEnum {
    Standard = `Standard`,
    OneSaber = `OneSaber`,
    NoArrows = `NoArrows`,
    NinetyDegree = `90Degree`,
    ThreeSixtyDegree = `360Degree`,
    Lightshow = `Lightshow`,
    Lawless = `Lawless`,
    Other = `Other`,
    All = `All`
}

export enum SubmissionCategory {
    OST = `Gen-OST`,
    NonStandardMap = `Gen-NonStandard`, //360,90,one saber, na
    FullSpreadMap = `Gen-FullSpread`,

    Lightshow = `Mods-Lightshow`,
    GameplayModchart = `Mods-GameplayModchart`,

    RankedMap = `Ranked-RankedMap`,

    BalancedMap = `Style-Balanced`,
    TechMap = `Style-Tech`,
    SpeedMap = `Style-Speed`,
    DanceMap = `Style-Dance`,
    FitnessMap = `Style-Fitness`,
    ChallengeMap = `Style-Challenge`,
    AccMap = `Style-Acc`,
    PoodleMap = `Style-Poodle`,
    WildcardMap = `Style-Wildcard`,

    PackOfTheYear = `OTY-Pack`,
    MapOfTheYear = `OTY-Map`,
    ModdedMapOfTheYear = `OTY-ModdedMap`,
    MapperOfTheYear = `OTY-Mapper`,
    LighterOfTheYear = `OTY-Lighter`,
    RookieLighterOfTheYear = `OTY-RookieLighter`,
    RookieMapperOfTheYear = `OTY-RookieMapper`
}

export type NominationCount = {
    Total: number;
    MapOfTheYear: number;
    MapperOfTheYear: number;
    ModdedMapOfTheYear: number;
    LighterOfTheYear: number;
    RookieMapperOfTheYear: number;
    RookieLighterOfTheYear: number;
    PackOfTheYear: number;
    OSTMap: number;
    NonStandardMap: number;
    FullSpreadMap: number;
    Lightshow: number;
    GameplayModchart: number;
    //ArtMap: number;
    RankedMap: number;
    BalancedMap: number;
    TechMap: number;
    SpeedMap: number;
    DanceMap: number;
    FitnessMap: number;
    ChallengeMap: number;
    AccMap: number;
    PoodleMap: number;
    WildcardMap: number;
};

export enum NominationStatusResponse {
    Accepted,
    AlreadyVoted,
    InvalidCategory,
    Invalid
}
// #endregion

export enum SortedSubmissionsCategory {
    OST = `Gen-OST`,
    NonStandardMap = `Gen-NonStandard`, //360,90,one saber, na
    FullSpreadMap = `Gen-FullSpread`,

    LightshowVanilla = `Lightshow-Vanilla`,
    LightshowVanillaPlus = `Lightshow-VanillaPlus`,
    LightshowChroma = `Lightshow-Chroma`,
    LightshowChromaPlus = `Lightshow-ChromaPlus`,
    LightshowVivify = `Lightshow-Vivify`,

    Modchart = `Mods-GameplayModchart`,
    //ArtMap = `Mods-ArtMap`,

    RankedMapBLLessThan8 = `Ranked-BLLessThan8`,
    RankedMapBL8To12 = `Ranked-BL8To12`,
    RankedMapBL12Plus = `Ranked-BL12Plus`,
    RankedMapSSLessThan8 = `Ranked-SSLessThan8`,
    RankedMapSS8To12 = `Ranked-SS8To12`,
    RankedMapSS12Plus = `Ranked-SS12Plus`,

    BalancedMap = `Style-Balanced`,
    LowTechMap = `Style-LowTech`,
    HighTechMap = `Style-HighTech`,
    SpeedMap = `Style-Speed`,
    DanceMap = `Style-Dance`,
    FitnessMap = `Style-Fitness`,
    ChallengeMap = `Style-Challenge`,
    AccMap = `Style-Acc`,
    PoodleMap = `Style-Poodle`,
    WildcardMap = `Style-Wildcard`,

    PackOfTheYear = `OTY-Pack`,
    MapOfTheYear = `OTY-Map`,
    ModdedMapOfTheYear = `OTY-ModdedMap`,
    MapperOfTheYear = `OTY-Mapper`,
    LighterOfTheYear = `OTY-Lighter`,
    RookieLighterOfTheYear = `OTY-RookieLighter`,
    RookieMapperOfTheYear = `OTY-RookieMapper`
}

// yoink thankies bstoday
export function validateEnumValue<T extends object>(value: any, enumType: T): value is T[keyof T] {
    if (Object.values(enumType).includes(value)) {
        return true;
    }
    return false;
}

export function isNameRequired(category: string): boolean {
    return (
        category == SubmissionCategory.PackOfTheYear ||
        category == SubmissionCategory.MapperOfTheYear ||
        category == SubmissionCategory.LighterOfTheYear ||
        category == SubmissionCategory.RookieMapperOfTheYear ||
        category == SubmissionCategory.RookieLighterOfTheYear ||
        category == SubmissionCategory.OST
    );
}

export function isDiffCharRequired(category: string): boolean {
    return (
        category != SubmissionCategory.PackOfTheYear &&
        category != SubmissionCategory.MapperOfTheYear &&
        category != SubmissionCategory.LighterOfTheYear &&
        category != SubmissionCategory.RookieMapperOfTheYear &&
        category != SubmissionCategory.RookieLighterOfTheYear &&
        category != SubmissionCategory.FullSpreadMap
    );
}

export function isNameRequiredSortedSubmission(category: string): boolean {
    return (
        category == SortedSubmissionsCategory.PackOfTheYear ||
        category == SortedSubmissionsCategory.MapperOfTheYear ||
        category == SortedSubmissionsCategory.LighterOfTheYear ||
        category == SortedSubmissionsCategory.RookieMapperOfTheYear ||
        category == SortedSubmissionsCategory.RookieLighterOfTheYear ||
        category == SortedSubmissionsCategory.OST
    );
}

export function isDiffCharRequiredSortedSubmission(category: string): boolean {
    return (
        category != SortedSubmissionsCategory.PackOfTheYear &&
        category != SortedSubmissionsCategory.MapperOfTheYear &&
        category != SortedSubmissionsCategory.LighterOfTheYear &&
        category != SortedSubmissionsCategory.RookieMapperOfTheYear &&
        category != SortedSubmissionsCategory.RookieLighterOfTheYear &&
        category != SortedSubmissionsCategory.FullSpreadMap &&
        category != SortedSubmissionsCategory.OST
    );
}

export function createRandomString(byteCount: number): string {
    let key = randomBytes(byteCount).toString(`base64url`);
    return key;
}
    