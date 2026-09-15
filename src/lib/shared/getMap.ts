import type { BSMap } from "./beatsaverTypes";

export async function getMap(id: string) {
    return await fetch(`https://beatsaver.com/api/maps/id/${id}`).then(res => {
        if (!res.ok) {
            throw new Error(`Failed to fetch map with id ${id}`);
        }
        return res.json() as Promise<BSMap>;
    });
}