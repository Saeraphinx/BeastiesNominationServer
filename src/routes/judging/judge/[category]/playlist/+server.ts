import type { RequestHandler } from "@sveltejs/kit";
import { SortedSubmission } from "../../../../../lib/server/database";
import { SortedSubmissionsCategory } from "../../../../../lib/shared/goodies";
import { z } from "zod";
import { PUBLIC_BASE_URL } from "$app/env/public";
import { m } from "../../../../../lib/paraglide/messages";
import { Logger } from "../../../../../lib/server/logger";

export const GET: RequestHandler = async ({ request, params, url }) => {
    let category = params.category as SortedSubmissionsCategory;
    let id = url.searchParams.get(`id`);
    if (!category || category.trim() === "" || !z.enum(SortedSubmissionsCategory).safeParse(category).success) {
        return new Response("Category not specified", { status: 400 });
    }

    if (!id || id.trim() === "") {
        return new Response("ID not specified", { status: 400 });
    }

    let submissions = await SortedSubmission.findAll({ where: { category: category } });
    const playlist: { playlistTitle: string, playlistAuthor: string, playlistDescription: string, image: string, syncURL: string, songs: { key: string, hash: string, difficulties?: { characteristic: string, name: string }[] }[] } = {
        playlistTitle: `${m[`common.sortedCategories.${category}.title`](undefined, { locale: "en" })} - 2026 Beasties`,
        playlistAuthor: `BeastiesNominationServer`,
        playlistDescription: `${m[`common.sortedCategories.${category}.description`](undefined, { locale: "en" })}`,
        image: `${PUBLIC_BASE_URL}/beastsaber.jpg`,
        syncURL: `${PUBLIC_BASE_URL}/judging/judge/${category}/playlist?id=${id}`,
        songs: []
    };

    for (let submission in submissions) {
        const curRes = submissions[submission];
        if (curRes.bsrId === null) {
            continue;
        } else {
            if (!curRes.hash || isEmptyOrSpaces(curRes.hash)) {
                await fetch(`https://api.beatsaver.com/maps/id/${curRes.bsrId}`).then(async (response) => {
                    if (response.status !== 200) {
                        return new Response(JSON.stringify({ message: `Invalid BSR ID` }), { status: 500 });
                    }
                    let json = await response.json() as any;
                    curRes.hash = json.versions[0].hash;
                    curRes.save();
                });
                console.log(`Submission ${curRes.id} has no hash, skipping...`);
            }
        }
        if (curRes.characteristic && curRes.difficulty && !isEmptyOrSpaces(curRes.characteristic) && !isEmptyOrSpaces(curRes.difficulty)) {
            playlist.songs.push({ key: curRes.bsrId, hash: curRes.hash!, difficulties: [{ characteristic: curRes.characteristic, name: curRes.difficulty }] });
        } else {
            playlist.songs.push({ key: curRes.bsrId, hash: curRes.hash! });
        }
    }
    Logger.log(`Generated playlist for category ${category} w/ id ${id}`);
    return new Response(JSON.stringify(playlist), { status: 200, headers: { "Content-Type": "application/json" } });
}

function isEmptyOrSpaces(str:string) {
    return str === null || str.match(/^ *$/) !== null;
}