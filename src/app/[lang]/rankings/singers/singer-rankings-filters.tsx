'use client'
import { EntityName } from "@/components/formatters/entity-name"
import { NumberFormatter } from "@/components/formatters/number-formatter"
import { Divider } from "@/components/material/divider"
import { DummyRankingsGridItem } from "@/components/rankings/dummy-rankings-grid-item"
import { DummyRankingsListItem } from "@/components/rankings/dummy-rankings-list-item"
import { RankingsGridItem } from "@/components/rankings/rankings-grid-item"
import { RankingListItem } from "@/components/rankings/rankings-list-item"
import { ArtistCategory, ArtistType, FilterOrder, SongType, SourceType } from "@/data/types"
import { GET_ARTIST_RANKINGS, buildEntityNames, graphClient } from "@/lib/api"
import { ApiArtist, ApiArtistRankingsFilterResult } from "@/lib/api/types"
import { LanguageDictionary, getEntityName } from "@/localization"
import { ApolloQueryResult, gql, useQuery } from "@apollo/client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { TransitionGroup } from "react-transition-group"
import { useSettings } from "../../settings/settings-provider"
import { ArtistRankingsFilterBarValues, ArtistRankingsFilters, ArtistRankingsFiltersValues, EntityNames, FilterType, InputFilter, RankingsViewMode, SongRankingsFilterBarValues } from "../types"
import { decodeBoolean, decodeMultiFilter, encodeBoolean, encodeMultiFilter, parseParamSelectFilterValue } from "../utils"
import { SingerRankingsActiveFilterBar } from "./singer-rankings-list"
import { ImageDisplayMode } from "@/lib/material/types"
import { buildFuzzyDate } from "@/lib/utils"

const GET_ARTISTS_NAMES = gql`
query GetArtistsNames(
    $ids: [Int]!
) {
    artists(
        ids: $ids
    ) {
        id
        names {
            original
            japanese
            english
            romaji
        }
    }
}
`

const defaultIncludeArtistTypes = [
    ArtistType[ArtistType.VOCALOID],
    ArtistType[ArtistType.CEVIO],
    ArtistType[ArtistType.SYNTHESIZER_V],
    ArtistType[ArtistType.OTHER_VOCALIST],
    ArtistType[ArtistType.OTHER_VOICE_SYNTHESIZER],
    ArtistType[ArtistType.UTAU],
]

export function SingerRankingsList(
    {
        href,
        filters,
        langDict,
        filterValues,
        currentTimestamp,
        viewMode,
        category
    }: {
        href: string
        filters: ArtistRankingsFilters
        langDict: LanguageDictionary
        filterValues: ArtistRankingsFiltersValues
        currentTimestamp: string
        viewMode: RankingsViewMode
        category: ArtistCategory
    }
) {
    // import contexts
    const { settings, setRankingsViewMode } = useSettings()
    const { resolvedTheme } = useTheme()

    // import settings
    const settingTitleLanguage = settings.titleLanguage
    const [rankingsViewMode, setViewMode] = useState(viewMode)

    // convert current timestamp to date
    const currentTimestampDate = new Date(currentTimestamp)

    // convert filterValues into filterBarValues
    let [filterBarValues, setFilterValues] = useState({
        search: filterValues.search,
        timePeriod: filterValues.timePeriod,
        songPublishYear: filterValues.songPublishYear,
        songPublishMonth: filterValues.songPublishMonth,
        songPublishDay: filterValues.songPublishDay,
        releaseYear: filterValues.releaseYear,
        releaseMonth: filterValues.releaseMonth,
        releaseDay: filterValues.releaseDay,
        includeSourceTypes: decodeMultiFilter(filterValues.includeSourceTypes),
        excludeSourceTypes: decodeMultiFilter(filterValues.excludeSourceTypes),
        includeSongTypes: decodeMultiFilter(filterValues.includeSongTypes),
        excludeSongTypes: decodeMultiFilter(filterValues.excludeSongTypes),
        includeArtistTypes: decodeMultiFilter(filterValues.includeArtistTypes),
        excludeArtistTypes: decodeMultiFilter(filterValues.excludeArtistTypes),
        minViews: filterValues.minViews,
        maxViews: filterValues.maxViews,
        orderBy: filterValues.orderBy,
        from: filterValues.from ? new Date(filterValues.from) : undefined,
        timestamp: filterValues.timestamp ? new Date(filterValues.timestamp) : undefined,
        singleVideo: decodeBoolean(Number(filterValues.singleVideo)),
        includeArtists: decodeMultiFilter(filterValues.includeArtists),
        excludeArtists: decodeMultiFilter(filterValues.excludeArtists),
        combineSimilarArtists: decodeBoolean(Number(filterValues.combineSimilarArtists))
    } as ArtistRankingsFilterBarValues)

    // entity names state
    const [entityNames, setEntityNames] = useState({} as EntityNames)

    // returns a table of query variables for querying GraphQL with.
    const getQueryVariables = () => {
        // build & set query variables
        const includeSourceTypes = filterBarValues.includeSourceTypes?.map(type => SourceType[type])
        const excludeSourceTypes = filterBarValues.excludeSourceTypes?.map(type => SourceType[type])
        const includeSongTypes = filterBarValues.includeSongTypes?.map(type => SongType[type])
        const excludeSongTypes = filterBarValues.excludeSongTypes?.map(type => SongType[type])
        const includeArtistTypes = filterBarValues.includeArtistTypes?.map(type => ArtistType[type])
        const excludeArtistTypes = filterBarValues.excludeArtistTypes?.map(type => ArtistType[type])

        // build publish date
        const releaseYear = filterBarValues.releaseYear
        const releaseMonth = filterBarValues.releaseMonth
        const releaseDay = filterBarValues.releaseDay

        const songPublishYear = filterBarValues.songPublishYear
        const songPublishMonth = filterBarValues.songPublishMonth
        const songPublishDay = filterBarValues.songPublishDay

        // get custom time period offset
        const to = filterBarValues.timestamp || currentTimestampDate
        const from = filterBarValues.from

        let customTimePeriodOffset: number | undefined
        if (filterBarValues.timePeriod == 4 && from && to) {
            // get the difference in milliseconds between the two dates
            const difference = Math.abs(to.getTime() - from.getTime())
            // convert the difference, which is in milliseconds into days and set the timePeriodOffset to that value
            customTimePeriodOffset = Math.floor(difference / (24 * 60 * 60 * 1000))
        }

        return {
            timestamp: filterBarValues.timestamp ? filterBarValues.timestamp?.toISOString() : undefined,
            timePeriodOffset: customTimePeriodOffset !== undefined ? customTimePeriodOffset : parseParamSelectFilterValue(filterBarValues.timePeriod, filters.timePeriod.values, filters.timePeriod.defaultValue),
            includeSourceTypes: includeSourceTypes && includeSourceTypes.length > 0 ? includeSourceTypes : undefined,
            excludeSourceTypes: excludeSourceTypes && excludeSourceTypes.length > 0 ? excludeSourceTypes : undefined,
            includeSongTypes: includeSongTypes && includeSongTypes.length > 0 ? includeSongTypes : undefined,
            excludeSongTypes: excludeSongTypes && excludeSongTypes.length > 0 ? excludeSongTypes : undefined,
            includeArtistTypes: includeArtistTypes && includeArtistTypes.length > 0 ? includeArtistTypes : defaultIncludeArtistTypes,
            excludeArtistTypes: excludeArtistTypes && excludeArtistTypes.length > 0 ? excludeArtistTypes : undefined,
            artistCategory: ArtistCategory[category],
            songPublishDate: (songPublishYear || songPublishMonth || songPublishDay) ? buildFuzzyDate(songPublishYear, songPublishMonth, songPublishDay) : undefined,
            publishDate: (releaseYear || releaseMonth || releaseDay) ? buildFuzzyDate(releaseYear, releaseMonth, releaseDay) : undefined,
            orderBy: filterBarValues.orderBy == undefined ? undefined : FilterOrder[filterBarValues.orderBy],
            //direction: undefined,
            includeArtists: filterBarValues.includeArtists && filterBarValues.includeArtists.length > 0 ? [...filterBarValues.includeArtists] : undefined, // unpack artists into new table so that the reference is different
            excludeArtists: filterBarValues.excludeArtists && filterBarValues.excludeArtists.length > 0 ? [...filterBarValues.excludeArtists] : undefined,
            combineSimilarArtists: filterBarValues.combineSimilarArtists,
            singleVideo: filterBarValues.singleVideo,
            minViews: filterBarValues.minViews ? Number(filterBarValues.minViews) : undefined,
            maxViews: filterBarValues.maxViews ? Number(filterBarValues.maxViews) : undefined,
            search: filterBarValues.search == '' ? undefined : filterBarValues.search
        }
    }

    // import graphql context
    const [queryVariables, setQueryVariables] = useState(getQueryVariables)
    const { loading, error, data } = useQuery(GET_ARTIST_RANKINGS, {
        variables: queryVariables
    })
    const rankingsResult = data?.artistRankings as ApiArtistRankingsFilterResult

    // function for saving filter values & updating the UI with the new values.
    function saveFilterValues(
        newValues: SongRankingsFilterBarValues,
        refresh: boolean = true,
        merge: boolean = true
    ) {
        filterBarValues = merge ? { ...newValues } : newValues
        setFilterValues(filterBarValues)
        // set url
        if (refresh) {
            const queryBuilder = []
            for (const key in filterBarValues) {
                const value = filterBarValues[key as keyof typeof filterBarValues]
                const filter = filters[key as keyof typeof filters]
                if (value != undefined && filter) {
                    switch (filter.type) {
                        case FilterType.SELECT:
                        case FilterType.INPUT:
                            if (value != (filter as InputFilter).defaultValue) queryBuilder.push(`${key}=${value}`)
                            break
                        case FilterType.CHECKBOX:
                            if (value) queryBuilder.push(`${key}=${encodeBoolean(value as boolean)}`)
                            break
                        case FilterType.MULTI_ENTITY:
                        case FilterType.MULTI:
                            const encoded = encodeMultiFilter(value as number[])
                            if (encoded != '') queryBuilder.push(`${key}=${encoded}`)
                            break
                        case FilterType.TIMESTAMP:
                            queryBuilder.push(`${key}=${(value as Date).toISOString()}`)
                            break
                    }
                }
            }
            history.pushState({}, 'Song rankings filter changed.', `${href}?${queryBuilder.join('&')}`)
            setQueryVariables(getQueryVariables())
        }
    }

    // load entity names map
    useEffect(() => {
        const artists = [...(filterBarValues.includeArtists || []), ...(filterBarValues.excludeArtists || [])]
        if (artists && artists.length > 0) {
            graphClient.query({
                query: GET_ARTISTS_NAMES,
                variables: {
                    ids: artists
                }
            }).then((result: ApolloQueryResult<any>) => {
                if (!result.error) {
                    const nameMap: EntityNames = {}
                    for (const artist of result.data.artists as ApiArtist[]) {
                        nameMap[artist.id] = getEntityName(buildEntityNames(artist.names), settingTitleLanguage)
                    }
                    setEntityNames({ ...entityNames, ...nameMap })
                }
            }).catch(_ => { })
        }
    }, [settingTitleLanguage])

    // load view mode
    useEffect(() => {
        setViewMode(settings.rankingsViewMode)
    }, [settings.rankingsViewMode])

    // generate dummy rankings
    const dummyElements: JSX.Element[] = []
    if (loading) {
        for (let i = 0; i < 50; i++) {
            dummyElements.push(rankingsViewMode == RankingsViewMode.LIST ? <DummyRankingsListItem keyValue={i} /> : <DummyRankingsGridItem keyValue={i}/>)
        }
    }

    return (
        <section className="flex flex-col gap-5 w-full">
            <SingerRankingsActiveFilterBar
                filters={filters}
                langDict={langDict}
                filterValues={filterBarValues}
                currentTimestamp={currentTimestampDate}
                setFilterValues={saveFilterValues}
                setRankingsViewMode={setRankingsViewMode}
                entityNames={entityNames}
                onEntityNamesChanged={newNames => setEntityNames({ ...newNames })}
            />
            <Divider />
            {error ? <h2 className="text-3xl font-bold text-center text-on-background">{error.message}</h2>
                : !loading && (rankingsResult == undefined || 0 >= rankingsResult.results.length) ? <h2 className="text-3xl font-bold text-center text-on-background">{langDict.search_no_results}</h2>
                    : <ol key='list-view' className={rankingsViewMode == RankingsViewMode.LIST ? "flex flex-col gap-5 w-full" : "grid xl:grid-cols-7 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-10 w-full mt-3"}>
                        {rankingsResult == undefined ? dummyElements : <TransitionGroup component={null}>{rankingsResult.results.map(ranking => {
                            const artist = ranking.artist
                            const names = buildEntityNames(artist.names)

                            const color = resolvedTheme == 'dark' ? artist.darkColor : artist.lightColor

                            return rankingsViewMode == RankingsViewMode.LIST ? (
                                <RankingListItem
                                    key={artist.id.toString()}
                                    href={`../artist/${artist.id}`}
                                    titleContent={<EntityName names={names} preferred={settingTitleLanguage} />}
                                    placement={ranking.placement}
                                    icon={artist.thumbnails.small || artist.thumbnails.medium || artist.thumbnails.original}
                                    iconAlt={getEntityName(names, settingTitleLanguage)}
                                    imageDisplayMode={ImageDisplayMode.VOCALIST}
                                    trailingTitleContent={<NumberFormatter number={ranking.views} />}
                                    trailingSupporting={langDict.rankings_views}
                                    color={color}
                                />
                            ) : (
                                <RankingsGridItem
                                    key={artist.id.toString()}
                                    href={`../artist/${artist.id}`}
                                    titleContent={<EntityName names={names} preferred={settingTitleLanguage} />}
                                    placement={ranking.placement}
                                    icon={artist.thumbnails.medium || artist.thumbnails.original}
                                    iconAlt={getEntityName(names, settingTitleLanguage)}
                                    imageDisplayMode={ImageDisplayMode.VOCALIST}
                                    trailingTitleContent={<NumberFormatter number={ranking.views} />}
                                    trailingSupporting={langDict.rankings_views}
                                    color={color}
                                />
                            )
                        })}</TransitionGroup>}
                    </ol>
            }
        </section>
    )
}