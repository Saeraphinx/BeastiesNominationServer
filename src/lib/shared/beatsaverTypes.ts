/*
MIT License

Copyright (c) 2023 StormPacer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

export interface BSMap {
    id: string
    name: string
    description: string
    uploader: Uploader
    metadata: Metadata
    stats: Stats
    uploaded: string
    automapper: boolean
    ranked: boolean
    qualified: boolean
    versions: Version[]
    createdAt: string
    updatedAt: string
    lastPublishedAt: string
    tags: string[]
    bookmarked: boolean
}

interface Uploader {
    id: number
    name: string
    hash: string
    avatar: string
    type: string
    admin: boolean
    curator: boolean
    playlistUrl: string
}

interface Metadata {
    bpm: number
    duration: number
    songName: string
    songSubName: string
    songAuthorName: string
    levelAuthorName: string
}

interface Stats {
    plays: number
    downloads: number
    upvotes: number
    downvotes: number
    score: number
}

interface Version {
    hash: string
    state: string
    createdAt: string
    sageScore: number
    diffs: Diff[]
    downloadURL: string
    coverURL: string
    previewURL: string
}

interface Diff {
    njs: number
    offset: number
    notes: number
    bombs: number
    obstacles: number
    nps: number
    length: number
    characteristic: string
    difficulty: string
    events: number
    chroma: boolean
    me: boolean
    ne: boolean
    cinema: boolean
    seconds: number
    paritySummary: ParitySummary
    maxScore: number
    label: string
}

interface ParitySummary {
    errors: number
    warns: number
    resets: number
}