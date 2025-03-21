'use client'
import { ArtistCard } from "@/components/entity/artist-card"
import ArtistsGrid from "@/components/entity/artists-grid"
import { ArtistsSkeleton } from "@/components/entity/artists-skeleton"
import { EntitySection } from "@/components/entity/entity-section"
import { EntityName } from "@/components/formatters/entity-name"
import { FilledButton } from "@/components/material/filled-button"
import { FilledIconButton } from "@/components/material/filled-icon-button"
import { ArtistCategory } from "@/data/types"
import { GET_ARTIST_RANKINGS, buildEntityNames } from "@/lib/api"
import { ApiArtistRankingsFilterResult } from "@/lib/api/types"
import { substituteStringVariables } from "@/lib/utils"
import { artistCategoryToApiArtistTypeNames } from "@/lib/utils"
import { LanguageDictionary, getEntityName } from "@/localization"
import { useQuery } from "graphql-hooks"
import { useTheme } from "next-themes"
import { useSettings } from "../../../../components/providers/settings-provider"
import { useLocale } from "@/components/providers/language-dictionary-provider"
import { RankingsApiError } from "@/components/rankings/rankings-api-error"

export function CoArtists(
    {
        artistId,
        category,
        maxEntries
    }: {
        artistId: number
        category: ArtistCategory
        maxEntries: number
    }
) {
    // import contexts
    const { settings } = useSettings()
    const { resolvedTheme } = useTheme()
    const langDict = useLocale()

    // import settings
    const settingTitleLanguage = settings.titleLanguage

    const artistIsVocalist = category == ArtistCategory.VOCALIST
    const categoryInversed = artistIsVocalist ? ArtistCategory.PRODUCER : ArtistCategory.VOCALIST

    // query graphql
    const { loading, error, data } = useQuery(GET_ARTIST_RANKINGS, {
        variables: {
            includeCoArtistsOf: [artistId],
            includeArtistTypes: artistCategoryToApiArtistTypeNames[categoryInversed],
            minViews: 1,
            maxEntries: maxEntries,
            orderBy: "SONG_COUNT"
        }
    })
    const rankingsResult = data?.artistRankings as ApiArtistRankingsFilterResult | undefined

    return rankingsResult === undefined || (rankingsResult != undefined && rankingsResult.totalCount === 0) ? undefined : <EntitySection
        title={langDict[artistIsVocalist ? 'artist_co_artists_vocalist' : 'artist_co_artists_producer']}
        titleSupporting={
            rankingsResult.totalCount > maxEntries ? <>
                <FilledButton className="sm:flex hidden" text={langDict.artist_view_all} icon={'open_in_full'} href={`../rankings/${artistIsVocalist ? 'producers' : 'singers'}?includeCoArtistsOf=${artistId}&minViews=1&orderBy=3`} />
                <FilledIconButton className="sm:hidden flex" icon={'open_in_full'} href={`../rankings?includeArtists=${artistId}`} />
            </> : undefined
        }
    >
        <article>
            {
                error ? <RankingsApiError error={error} />
                    : loading ? <ArtistsSkeleton elementCount={maxEntries} className="xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2" />
                        : <ArtistsGrid className="xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2">{rankingsResult.results.map(ranking => {
                                const artist = ranking.artist
                                const names = buildEntityNames(artist.names)

                                const color = resolvedTheme == 'dark' ? artist.darkColor : artist.lightColor

                                return (
                                    <ArtistCard
                                        key={artist.id}
                                        src={artist.thumbnails.small || artist.thumbnails.original}
                                        alt={getEntityName(names, settingTitleLanguage)}
                                        bgColor={color}
                                        href={`../artist/${artist.id}`}
                                        title={<EntityName names={names} preferred={settingTitleLanguage} />}
                                        text={substituteStringVariables(langDict['artist_co_artists_featured_song_count'], { count: ranking.views.toString() })}
                                        isSinger={!artistIsVocalist}
                                    />
                                )
                            })}</ArtistsGrid>
            }
        </article>
    </EntitySection>
}