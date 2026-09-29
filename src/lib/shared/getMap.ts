import type { BSMap, BSUser, BSPlaylist } from "./beatsaverTypes";

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

export async function getUser(id: number | string) {
    return await fetch(`https://beatsaver.com/api/users/id/${id}`).then(res => {
        if (!res.ok) {
            throw new Error(`Failed to fetch user with id ${id}`);
        }
        return res.json() as Promise<BSUser>;
    });
}

export async function getBulkUsers(id: (number | string)[]) {
    if (id.length === 0 || id.length > 50) {
        throw new Error(`Invalid number of ids: ${id.length}`);
    }
    return await fetch(`https://beatsaver.com/api/users/ids/${id.join(",")}`).then(res => {
        if (!res.ok) {
            throw new Error(`Failed to fetch bulk users with ids ${id.join(",")}`);
        }
        return res.json() as Promise<BSUser[]>;
    });
}

export async function getPlaylist(id: string) {
    return await fetch(`https://beatsaver.com/api/playlists/id/${id}/1`).then(res => {
        if (!res.ok) {
            throw new Error(`Failed to fetch playlist with id ${id}`);
        }
        return res.json() as Promise<BSPlaylist>;
    });
}