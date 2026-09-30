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

i18nToTsv();
//tsvToI18n();