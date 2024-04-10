import { FilterOrder } from "@/data/types"
import { SelectFilterValue, SongRankingsFiltersValues } from "./types"
import { RankingsItemTrailingMode } from "@/components/rankings/rankings-item-trailing"
import { ReadonlyURLSearchParams } from "next/navigation"

export function encodeBoolean(
    bool: boolean
): number {
    return bool ? 1 : 0
}

export function decodeBoolean(
    num?: number
): boolean {
    return num == 1
}

export function encodeMultiFilter(
    values: number[],
    separator: string = ','
): string {
    const builder = []
    for (const value of values) {
        if (!isNaN(value)) builder.push(value)
    }
    return builder.join(separator)
}

export function decodeMultiFilter(
    input?: string,
    separator: string = ','
): number[] {
    const output: number[] = []

    input?.split(separator).map(rawValue => {
        const parsed = Number(rawValue)
        if (!isNaN(parsed)) {
            output.push(parsed)
        }
    })

    return output
}


/**
 * Helper function for extracting an integer value from search parameters.
 * 
 * @param params The search parameters to extract the value from.
 * @param key The key of the value to extract.
 * @returns The extracted number or undefined.
 */
export function getNumericSearchParam(value: string | undefined): number | undefined {
    return value !== undefined ? parseInt(value) : undefined
}

/**
 * Helper function for extracting a Date value from search parameters.
 * 
 * @param params The search parameters to extract the value from.
 * @param key The key of the value to extract.
 * @returns The extracted Date or undefined.
 */
export function getDateSearchParam(value: string | undefined): Date | undefined {
    return value !== undefined ? new Date(value) : undefined;
}

export function pickSongDefaultOrSearchParam(params: ReadonlyURLSearchParams, defaults: SongRankingsFiltersValues, key: string): string | undefined {
    const paramValue = params.get(key)
    const defaultValue = defaults[key as keyof SongRankingsFiltersValues]
    return defaultValue !== undefined ? defaultValue : paramValue !== null ? paramValue : undefined
}

export function parseParamSelectFilterValue(
    paramValue: number | undefined,
    values: SelectFilterValue<number>[],
    defaultValue?: number
): number | null {
    // get the filterValue and return it
    const valueNumber = (paramValue == undefined || isNaN(paramValue)) ? (defaultValue == undefined || isNaN(defaultValue)) ? null : defaultValue : paramValue
    return valueNumber != null ? (values[valueNumber]).value : null
}

export function getRankingsItemTrailingSupportingText(
    mode: RankingsItemTrailingMode | FilterOrder,
    views?: string,
    songCount?: string,
    publishDate?: string,
    additionDate?: string
): string | undefined {
    switch (mode) {
        case RankingsItemTrailingMode.VIEWS:
            return views
        case RankingsItemTrailingMode.SONG_COUNT:
            return songCount;
        case RankingsItemTrailingMode.PUBLISH_DATE:
            return publishDate;
        case RankingsItemTrailingMode.ADDITION_DATE:
            return additionDate
        default:
            return undefined
    }
}