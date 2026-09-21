import type { BSMap } from "./beatsaverTypes";

export async function getMap(id: string) {
    return await fetch(`https://beatsaver.com/api/maps/id/${id}`).then(res => {
        if (!res.ok) {
            throw new Error(`Failed to fetch map with id ${id}`);
        }
        return res.json() as Promise<BSMap>;
    });
}

export async function getBulkMaps(id: string[]) {
    if (id.length === 0 || id.length > 50) {
        throw new Error(`Invalid number of ids: ${id.length}`);
    }
    return await fetch(`https://beatsaver.com/api/maps/ids/${id.join(",")}`).then(res => {
        if (!res.ok) {
            throw new Error(`Failed to fetch bulk maps with ids ${id.join(",")}`);
        }
        return res.json() as Promise<Record<BSMap[`id`], BSMap>>;
    });
}