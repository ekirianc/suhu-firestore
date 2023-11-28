import { valueOrDefault } from "chart.js/helpers";

let _seed = Date.now();

export function rand(min?: number, max?: number): number {
    min = valueOrDefault(min, 0);
    max = valueOrDefault(max, 0);
    _seed = (_seed * 9301 + 49297) % 233280;
    return min + (_seed / 233280) * (max - min);
}

export function numbers(config: {
    min?: number;
    max?: number;
    from?: number[];
    count?: number;
    decimals?: number;
    continuity?: number;
}): number[] {
    const cfg = config || {};
    const min = valueOrDefault(cfg.min, 0);
    const max = valueOrDefault(cfg.max, 100);
    const from = valueOrDefault(cfg.from, []);
    const count = valueOrDefault(cfg.count, 8);
    const decimals = valueOrDefault(cfg.decimals, 8);
    const continuity = valueOrDefault(cfg.continuity, 1);
    const dfactor = Math.pow(10, decimals) || 0;
    const data: number[] = [];
    let value;

    for (let i = 0; i < count; ++i) {
        value = (from[i] || 0) + rand(min, max);
        if (rand() <= continuity) {
            data.push(Math.round(dfactor * value) / dfactor);
        } else {
            data.push();
        }
    }

    return data;
}

const MONTHS: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

export function months(config: { count?: number; section?: number }): string[] {
    const cfg = config || {};
    const count = cfg.count || 12;
    const section = cfg.section;
    const values: string[] = [];

    for (let i = 0; i < count; ++i) {
        const value = MONTHS[Math.ceil(i) % 12];
        values.push(value.substring(0, section));
    }

    return values;
}
