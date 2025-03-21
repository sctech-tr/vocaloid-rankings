import { getMostRecentViewsTimestamp } from "@/data/songsData"
import { ArtistCategory, ArtistType, FilterDirection, FilterOrder, SongType, SourceType } from "@/data/types"
import { artistCategoryToApiArtistTypes, generateTimestamp } from "@/lib/utils"
import { Locale, getDictionary } from "@/localization"
import { cookies } from "next/headers"
import { Settings } from "../../settings"
import { ArtistRankingsFilters, FilterType } from "../types"
import { ArtistRankingsList } from "../artist-rankings-list"
import { Metadata } from "next"

const filters: ArtistRankingsFilters = {
    search: {
        name: 'search_hint',
        key: 'search',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'search_hint',
        defaultValue: ''
    },
    timePeriod: {
        name: 'filter_time_period_offset',
        key: 'timePeriod',
        displayActive: true,
        type: FilterType.SELECT,
        values: [
            { name: 'filter_time_period_offset_all_time', value: null },
            { name: 'filter_time_period_offset_day', value: 1 },
            { name: 'filter_time_period_offset_week', value: 7 },
            { name: 'filter_time_period_offset_month', value: 30 },
            { name: 'filter_time_period_offset_custom', value: null }
        ],
        defaultValue: 0
    },
    songPublishYear: {
        name: 'artist_filter_song_year',
        key: 'songPublishYear',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    songPublishMonth: {
        name: 'artist_filter_song_month',
        key: 'songPublishMonth',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    songPublishDay: {
        name: 'artist_filter_song_day',
        key: 'songPublishDay',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    releaseYear: {
        name: 'artist_filter_year',
        key: 'releaseYear',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    releaseMonth: {
        name: 'artist_filter_month',
        key: 'releaseMonth',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    releaseDay: {
        name: 'artist_filter_day',
        key: 'releaseDay',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_year_any',
        defaultValue: ''
    },
    includeSourceTypes: {
        name: 'filter_view_type',
        key: 'includeSourceTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: "youtube", value: SourceType.YOUTUBE },
            { name: 'niconico', value: SourceType.NICONICO },
            { name: 'bilibili', value: SourceType.BILIBILI },
        ]
    },
    excludeSourceTypes: {
        name: 'filter_view_type_exclude',
        key: 'excludeSourceTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: "youtube", value: SourceType.YOUTUBE },
            { name: 'niconico', value: SourceType.NICONICO },
            { name: 'bilibili', value: SourceType.BILIBILI },
        ]
    },
    includeSongTypes: {
        name: 'filter_song_type', // name
        key: 'includeSongTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: 'filter_song_type_original', value: SongType.ORIGINAL },
            { name: 'filter_song_type_remix', value: SongType.REMIX },
            { name: 'filter_song_type_cover', value: SongType.COVER },
            { name: 'filter_song_type_remaster', value: SongType.REMASTER },
            { name: "filter_song_type_drama_pv", value: SongType.DRAMA_PV},
            { name: "filter_song_type_music_pv", value: SongType.MUSIC_PV},
            { name: 'filter_song_type_other', value: SongType.OTHER }
        ]
    },
    excludeSongTypes: {
        name: 'filter_song_type_exclude', // name
        key: 'excludeSongTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: 'filter_song_type_original', value: SongType.ORIGINAL },
            { name: 'filter_song_type_remix', value: SongType.REMIX },
            { name: 'filter_song_type_cover', value: SongType.COVER },
            { name: 'filter_song_type_remaster', value: SongType.REMASTER },
            { name: "filter_song_type_drama_pv", value: SongType.DRAMA_PV},
            { name: "filter_song_type_music_pv", value: SongType.MUSIC_PV},
            { name: 'filter_song_type_other', value: SongType.OTHER }
        ]
    },
    includeArtistTypes: {
        name: 'filter_artist_type', // name
        key: 'includeArtistTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: 'filter_artist_type_vocaloid', value: ArtistType.VOCALOID },
            { name: 'filter_artist_type_cevio', value: ArtistType.CEVIO },
            { name: 'filter_artist_type_synth_v', value: ArtistType.SYNTHESIZER_V },
            { name: 'filter_artist_type_other_vocalist', value: ArtistType.OTHER_VOCALIST },
            { name: 'filter_artist_type_other_voice_synth', value: ArtistType.OTHER_VOICE_SYNTHESIZER },
            { name: 'filter_artist_type_utau', value: ArtistType.UTAU },
            { name: 'filter_artist_type_project_sekai', value: ArtistType.PROJECT_SEKAI },
            { name: 'filter_artist_type_voicevox', value: ArtistType.VOICEVOX },
            { name: 'filter_artist_type_voisona', value: ArtistType.VOISONA },
            { name: 'filter_artist_type_neutrino', value: ArtistType.NEUTRINO },
            { name: 'filter_artist_type_voiceroid', value: ArtistType.VOICEROID },
            { name: 'filter_artist_type_new_type', value: ArtistType.NEW_TYPE }
        ],
        defaultValue: artistCategoryToApiArtistTypes[ArtistCategory.VOCALIST]
    },
    excludeArtistTypes: {
        name: 'filter_artist_type_exclude', // name
        key: 'excludeArtistTypes',
        displayActive: true,
        type: FilterType.MULTI,
        values: [
            { name: 'filter_artist_type_vocaloid', value: ArtistType.VOCALOID },
            { name: 'filter_artist_type_cevio', value: ArtistType.CEVIO },
            { name: 'filter_artist_type_synth_v', value: ArtistType.SYNTHESIZER_V },
            { name: 'filter_artist_type_other_vocalist', value: ArtistType.OTHER_VOCALIST },
            { name: 'filter_artist_type_other_voice_synth', value: ArtistType.OTHER_VOICE_SYNTHESIZER },
            { name: 'filter_artist_type_utau', value: ArtistType.UTAU },
            { name: 'filter_artist_type_project_sekai', value: ArtistType.PROJECT_SEKAI },
            { name: 'filter_artist_type_voicevox', value: ArtistType.VOICEVOX },
            { name: 'filter_artist_type_voisona', value: ArtistType.VOISONA },
            { name: 'filter_artist_type_neutrino', value: ArtistType.NEUTRINO },
            { name: 'filter_artist_type_voiceroid', value: ArtistType.VOICEROID },
            { name: 'filter_artist_type_new_type', value: ArtistType.NEW_TYPE }
        ]
    },
    minViews: {
        name: 'filter_min_views',
        key: 'minViews',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_views_any',
        defaultValue: ''
    },
    maxViews: {
        name: 'filter_max_views',
        key: 'maxViews',
        displayActive: true,
        type: FilterType.INPUT,
        placeholder: 'filter_views_any',
        defaultValue: ''
    },
    orderBy: {
        name: 'filter_order_by',
        key: 'orderBy',
        displayActive: false,
        type: FilterType.SELECT,
        values: [
            { name: 'filter_order_by_views', value: FilterOrder.VIEWS },
            { name: 'artist_publish_date', value: FilterOrder.PUBLISH_DATE },
            { name: 'filter_order_by_addition', value: FilterOrder.ADDITION_DATE },
            { name: 'filter_order_by_song_count', value: FilterOrder.SONG_COUNT }
        ],
        defaultValue: 0 // default value
    },
    from: {
        name: 'filter_time_period_offset_custom_from',
        key: 'from',
        displayActive: true,
        type: FilterType.TIMESTAMP,
        placeholder: 'filter_timestamp_latest',
    },
    to: {
        name: 'filter_time_period_offset_custom_to',
        key: 'to',
        displayActive: false,
        type: FilterType.TIMESTAMP,
        placeholder: 'filter_timestamp_latest',
    },
    timestamp: {
        name: 'filter_timestamp',
        key: 'timestamp',
        displayActive: true,
        type: FilterType.TIMESTAMP,
        placeholder: 'filter_timestamp_latest',
    },
    singleVideo: {
        name: 'filter_single_video_single',
        key: 'singleVideo',
        displayActive: true,
        type: FilterType.CHECKBOX,
        defaultValue: false
    },
    includeArtists: {
        name: 'filter_artists',
        key: 'includeArtists',
        displayActive: true,
        type: FilterType.MULTI_ENTITY,
        placeholder: 'filter_artists_placeholder',
    },
    excludeArtists: {
        name: 'filter_exclude_artists',
        key: 'excludeArtists',
        displayActive: true,
        type: FilterType.MULTI_ENTITY,
        placeholder: 'filter_artists_placeholder',
    },
    includeCoArtistsOf: {
        name: 'filter_artists_include_co_artists',
        key: 'includeCoArtistsOf',
        displayActive: true,
        type: FilterType.MULTI_ENTITY,
        placeholder: 'filter_artists_placeholder',
    },
    combineSimilarArtists: {
        name: 'filter_combine_similar_artists',
        key: 'combineSimilarArtists',
        displayActive: true,
        type: FilterType.CHECKBOX,
        defaultValue: false
    },
    direction: {
        name: 'filter_direction',
        key: 'direction',
        displayActive: false,
        type: FilterType.SELECT,
        values: [
            { name: 'filter_direction_descending', value: FilterDirection.DESCENDING },
            { name: 'filter_direction_ascending', value: FilterDirection.ASCENDING }
        ],
        defaultValue: 0 // default value
    },
    startAt: {
        name: 'filter_artist_type',
        key: 'startAt',
        displayActive: false,
        type: FilterType.INPUT,
        placeholder: 'filter_views_any',
        defaultValue: ''
    }
}

export async function generateMetadata(
    props: {
        params: Promise<{
            lang: Locale
        }>
    }
): Promise<Metadata> {
    const params = await props.params;
    const langDict = await getDictionary(params.lang)

    return {
        title: langDict.singer_rankings_page_title,
    }
}

export default async function RankingsPage(
    props: {
        params: Promise<{
            lang: Locale
        }>
    }
) {
    const params = await props.params;
    // import language dictionary
    const lang = params.lang
    const langDict = await getDictionary(lang)

    // get settings
    const settings = new Settings(await cookies())

    // general variables
    const viewMode = settings.rankingsViewMode

    const mostRecentTimestamp = (await getMostRecentViewsTimestamp()) || generateTimestamp()

    return (
        <section className="flex flex-col gap-5 w-full min-h-screen">
            <h1 className="font-bold md:text-5xl md:text-left text-4xl text-center w-full mb-5">{langDict.singer_rankings_page_title}</h1>
            <ArtistRankingsList
                href=''
                filters={filters}
                defaultFilters={{}}
                currentTimestamp={mostRecentTimestamp}
                viewMode={viewMode}
                category={ArtistCategory.VOCALIST}
            />
        </section>
    )
}
