import en from '../messages/en.json' with { type: 'json' };
import jp from '../messages/jp.json' with { type: 'json' };
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';

function escapeTsv(value: unknown): string {
    return String(value)
        .replaceAll('\\', '\\\\')
        .replaceAll('\t', '\\t')
        .replaceAll('\r', '\\r')
        .replaceAll('\n', '\\n');
}

function unescapeTsv(value: string): string {
    return value.replaceAll(/\\([\\trn])/g, (_, character: string) => {
        if (character === 't') return '\t';
        if (character === 'r') return '\r';
        if (character === 'n') return '\n';
        return '\\';
    });
}

async function i18nToTsv() {
    let outputString = 'Key\tEnglish\tJapanese\n';
    
    //flatten nested objects
    const flatten = (obj: any, prefix = ''): Record<string, any> => {
        return Object.keys(obj).reduce((acc, k) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object') Object.assign(acc, flatten(obj[k], pre + k));
            else acc[pre + k] = obj[k];
            return acc;
        }, {} as Record<string, any>);
    };

    const flatEn = flatten(en);
    const flatJp = flatten(jp);

    for (const key of Object.keys(flatEn)) {
        outputString += `${escapeTsv(key)}\t${escapeTsv(flatEn[key])}\t${escapeTsv(flatJp[key] ?? '')}\n`;
    }
    writeFileSync('storage/i18n.tsv', outputString);
}

async function tsvToI18n(cleanEmpty = true) {
    const tsvString = readFileSync('storage/i18n.tsv', 'utf-8');

    const lines = tsvString.split('\n').slice(1); // remove header
    const en: Record<string, any> = {};
    const jp: Record<string, any> = {};

    const unflatten = (obj: Record<string, any>): Record<string, any> => {
        const result: Record<string, any> = {};
        for (const key in obj) {
            if (!key) continue;
            const keys = key.split('.');
            keys.reduce((acc, k, i) => {
                if (!k) return acc;
                if (i === keys.length - 1) {
                    acc[k] = obj[key];
                } else {
                    acc[k] = acc[k] || {};
                }
                return acc[k];
            }, result);
        }
        return result;
    };

    for (const line of lines) {
        if (!line) continue;
        const [key, english, japanese] = line.split('\t');
        en[unescapeTsv(key)] = unescapeTsv(english);
        jp[unescapeTsv(key)] = unescapeTsv(japanese ?? '').replaceAll(`\r`, ``);
    }

    const nestedEn = unflatten(en);
    const nestedJp = unflatten(jp);
    
    // remove empty strings and objects from nestedEn and nestedJp
    const removeEmpty = (obj: Record<string, any>): Record<string, any> => {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value && typeof value === 'object') {
                const nested = removeEmpty(value);
                if (Object.keys(nested).length > 0) {
                    acc[key] = nested;
                }
            } else if (value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>);
    };

    const cleanedEn = cleanEmpty ? removeEmpty(nestedEn) : nestedEn;
    const cleanedJp = cleanEmpty ? removeEmpty(nestedJp) : nestedJp;

    mkdirSync('storage/i18n', { recursive: true });
    renameSync('messages/en.json', `storage/i18n/en-${Date.now()}.json.bak`);
    renameSync('messages/jp.json', `storage/i18n/jp-${Date.now()}.json.bak`);
    writeFileSync('messages/en.json', JSON.stringify(cleanedEn, null, 2));
    writeFileSync('messages/jp.json', JSON.stringify(cleanedJp, null, 2));
}

//i18nToTsv();
tsvToI18n();