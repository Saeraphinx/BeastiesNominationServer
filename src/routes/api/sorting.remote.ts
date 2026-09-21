import { form, getRequestEvent, query } from "$app/server";
import { z } from "zod";
import { Judge, SortedSubmission, Submission } from "../../lib/server/database";
import { CharacteristicEnum, DifficultyEnum, isNameRequiredSortedSubmission, isDiffCharRequiredSortedSubmission, SortedSubmissionsCategory } from "../../lib/shared/goodies";
import type { BSMap } from "../../lib/shared/beatsaverTypes";
import { getJudgeFromEvent } from "../../lib/server/auth";
import type { WhereOptions } from "sequelize";

export const getSubmissions = query(z.object({
    category: z.string().optional()
}), async (inputs) => {
    const { judge } = await getJudgeFromEvent(); 
    if (!judge.roles.includes("sort") && !judge.roles.includes("admin")) {
        throw new Error("Unauthorized");
    }

    let whereOptions: WhereOptions<Submission> = { 
        filterStatus: null
    };

    if (inputs.category) {
        whereOptions = { ...whereOptions, category: inputs.category };
    }

    return Submission.findAll({
        where: whereOptions,
        limit: 250
    }).then(submissions => submissions.map(submission => submission.toJSON()));
});

export const approveSubmission = form(z.object({
    submissionId: z.number(),
    name: z.string(),
    bsrId: z.string(),
    difficulty: z.enum(DifficultyEnum),
    characteristic: z.enum(CharacteristicEnum),
    category: z.enum(SortedSubmissionsCategory),
    doubleRankedCategory: z.enum(SortedSubmissionsCategory),
    accepted: z.boolean()
}).partial(), async (input) => {
    const { judge } = await getJudgeFromEvent();
    if (!judge.roles.includes("sort")) {
        throw new Error("Unauthorized");
    }

    const submission = await Submission.findByPk(input.submissionId);
    if (!submission) {
        throw new Error("Submission not found");
    }

    const duplicateSubmissions = await submission.findDuplicateSubmissions();

    if (input.accepted === true) {
        if (!input.category) {
            throw new Error("Category is required");
        }

        if (isNameRequiredSortedSubmission(input.category)) {
            if (!input.name || input.name.trim() === "") {
                throw new Error("Name is required");
            }
        } else if (isDiffCharRequiredSortedSubmission(input.category)) {
            if (!input.bsrId || input.bsrId.trim() === "") {
                throw new Error("BSR ID is required");
            }
            if (!input.difficulty) {
                throw new Error("Difficulty is required");
            }
            if (!input.characteristic) {
                throw new Error("Characteristic is required");
            }
        } else {
            if (!input.bsrId || input.bsrId.trim() === "") {
                throw new Error("BSR ID is required");
            }
        }

        const mapData = !isNameRequiredSortedSubmission(input.category) ? undefined : await getMapData(input.bsrId!);

        SortedSubmission.create({
            category: input.category,
            name: input.name,
            bsrId: input.bsrId,
            difficulty: input.difficulty,
            characteristic: input.characteristic,
            submitterIds: [submission.submitterId, ...duplicateSubmissions.map(ds => ds.submitterId)],
            hash: mapData?.hash,
            involvedMappers: mapData?.involvedMappers.map(String),
        });

        if (input.doubleRankedCategory) {
            SortedSubmission.create({
                category: input.doubleRankedCategory,
                name: input.name,
                bsrId: input.bsrId,
                difficulty: input.difficulty,
                characteristic: input.characteristic,
                submitterIds: [submission.submitterId, ...duplicateSubmissions.map(ds => ds.submitterId)],
                hash: mapData?.hash,
                involvedMappers: mapData?.involvedMappers.map(String),
            });
        }

        submission.update({
            filterStatus: `Accepted`,
            filtererId: judge.judgeId
        });

        for (const duplicateSubmission of duplicateSubmissions) {
            await duplicateSubmission.update({
                filterStatus: `Duplicate`,
                filtererId: judge.judgeId
            });
        }
    } else {
        submission.update({
            filterStatus: `Rejected`,
            filtererId: judge.judgeId
        });
        duplicateSubmissions.forEach(async (duplicateSubmission) => {
            await duplicateSubmission.update({
                filterStatus: `RejectedDuplicate`,
                filtererId: judge.judgeId
            });
        });
    }

    await submission.save();
    return submission.toJSON();
});

async function getMapData(bsrId: string) {
    let parsedBSR = parseInt(bsrId, 16);
    if (isNaN(parsedBSR)) {
        return;
    }
    return await fetch(`https://api.beatsaver.com/maps/id/${parsedBSR.toString(16)}`).then(
        async (response) => {
            if (response.status !== 200) {
                return;
            }

            let json = (await response.json()) as BSMap;
            return {
                hash: json.versions[0].hash,
                involvedMappers: [
                    json.uploader.id,
                    ...(json.collaborators ? json.collaborators.map(collab => collab.id) : [])
                ]
            };
        }
    );
}