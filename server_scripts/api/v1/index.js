const mercurius = require('mercurius')

// import database stuff
const { songsDataProxy } = require("../../../db")
const SongRows = require('../../../db/enums/SongRows')
const NameType = require('../../../db/enums/NameType')
const ViewType = require('../../../db/enums/ViewType')
const ArtistRows = require('../../../db/enums/ArtistRows')

// schemaTypeClasses

class ArtistThumbnail {
    #data

    constructor(data) {
        this.#data = data

        this.url = data.url
    }

    type() {
        switch(this.#data.type.id) {
            case 0:
                return 'ORIGINAL'
            case 1:
                return 'MEDIUM'
            case 2:
                return 'SMALL'
            case 3:
                return 'TINY'
        }
    }
}

class Artist {
    #artistData

    constructor(artistData) {
        this.#artistData = artistData

        this.id =  artistData.id
        this.publishDate = artistData.publishDate
        this.additionDate = artistData.additionDate
        this.averageColor = artistData.averageColor
        this.darkColor = artistData.darkColor
        this.lightColor = artistData.lightColor
        this.placement = artistData.placement
    }

    type() {
        switch (this.#artistData.type.id) {
            case 0:
                return 'VOCALOID'
            case 1:
                return 'CEVIO'
            case 2:
                return 'SYNTHESIZER_V'
            case 3:
                return 'ILLUSTRATOR'
            case 4:
                return 'COVER_ARTIST'
            case 5:
                return 'ANIMATOR'
            case 6:
                return 'PRODUCER'
            case 7:
                return 'OTHER_VOCALIST'
            case 8:
                return 'OTHER_VOICE_SYNTHESIZER'
            case 9:
                return 'OTHER_INDIVIDUAL'
            case 10:
                return 'OTHER_GROUP'
            case 11:
                return 'UTAU'
        }
    }

    category() {
        switch(this.#artistData.category.id) {
            case 0:
                return 'VOCALIST'
            case 1:
                return 'PRODUCER'
        }
    }

    names() {
        const names = this.#artistData.names
        return {
            original: names[NameType.Original.id],
            japanese: names[NameType.Japanese.id],
            english: names[NameType.English.id],
            romaji: names[NameType.Romaji.id]
        }
    }

    thumbnails() {
        const thumbnails = []
        this.#artistData.thumbnails.forEach(thumbnail => {
            thumbnails.push(new ArtistThumbnail(thumbnail))
        })
        return thumbnails
    }

    baseArtist() {
        return new Artist(this.#artistData.baseArtist)
    }

    async views({ timestamp }) {
        const views = timestamp ? await songsDataProxy.getArtistViews(this.id, timestamp) : this.#artistData.views
        const breakdown = views.breakdown

        return {
            timestamp: views.timestamp,
            total: views.total,
            breakdown: {
                youtube: breakdown[ViewType.YouTube.id],
                niconico: breakdown[ViewType.Niconico.id],
                bilibili: breakdown[ViewType.bilibili.id]
            }
        }
    }

    async placement({ timestamp }) {
        return timestamp ? await songsDataProxy.getArtistPlacement(this.id, timestamp) : this.#artistData.placement
    }
}

class Song {
    #songData

    constructor(songData) {
        this.#songData = songData
        this.id = songData.id
        this.publishDate = songData.publishDate
        this.additionDate = songData.additionDate
        this.thumbnail = songData.thumbnail
        this.maxresThumbnail = songData.maxresThumbnail
        this.averageColor = songData.averageColor
        this.darkColor = songData.darkColor
        this.lightColor = songData.lightColor
        this.fandomUrl = songData.fandomUrl
        this.displayThumbnail = songData.displayThumbnail
        this.maxresDisplayThumbnail = songData.maxresDisplayThumbnail
    }

    type() {
        switch (this.#songData.type.id) {
            case 0:
                return 'ORIGINAL'
            case 1:
                return 'REMIX'
            case 2:
                return 'OTHER'
        }
    }

    thumbnailType() {
        switch (this.#songData.thumbnailType.id) {
            case 0:
                return 'YOUTUBE'
            case 1:
                return 'NICONICO'
            case 2:
                return 'BILIBILI'
        } 
    }

    artists() {
        const artists = []

        this.#songData.artists.forEach(artistData => {
            artists.push(new Artist(artistData))
        })

        return artists
    }

    names() {
        const names = this.#songData.names
        return {
            original: names[NameType.Original.id],
            japanese: names[NameType.Japanese.id],
            english: names[NameType.English.id],
            romaji: names[NameType.Romaji.id]
        }
    }

    videoIds() {
        const videoIds = this.#songData.videoIds
        return {
            youtube: videoIds[ViewType.YouTube.id],
            niconico: videoIds[ViewType.Niconico.id],
            bilibili: videoIds[ViewType.bilibili.id]
        }
    }

    async views({ timestamp }) {
        const views = timestamp ? await songsDataProxy.getSongViews(this.id, timestamp) : this.#songData.views
        const breakdown = views.breakdown

        return {
            timestamp: views.timestamp,
            total: views.total,
            breakdown: {
                youtube: breakdown[ViewType.YouTube.id],
                niconico: breakdown[ViewType.Niconico.id],
                bilibili: breakdown[ViewType.bilibili.id]
            }
        }
    }

    async placement({ timestamp }) {
        return timestamp ? await songsDataProxy.getSongPlacement(this.id, timestamp) : this.#songData.placement
    }

}

var schema = `
    enum SongType {
        ORIGINAL
        REMIX
        OTHER
    }

    enum ViewType {
        YOUTUBE
        NICONICO
        BILIBILI
    }

    enum ArtistType {
        VOCALOID
        CEVIO
        SYNTHESIZER_V
        ILLUSTRATOR
        COVER_ARTIST
        ANIMATOR
        PRODUCER
        OTHER_VOCALIST
        OTHER_VOICE_SYNTHESIZER
        OTHER_INDIVIDUAL
        OTHER_GROUP
        UTAU
    }

    enum ArtistCategory {
        VOCALIST
        PRODUCER
    }

    enum ArtistThumbnailType {
        ORIGINAL
        MEDIUM
        SMALL
        TINY
    }

    type EntityNames {
        original: String
        japanese: String
        english: String
        romaji: String
    }

    type SongVideoIds {
        youtube: [String]
        niconico: [String]
        bilibili: [String]
    }

    type VideoViews {
        id: String!
        views: Float!
    }

    type EntityViewsBreakdown {
        youtube: [VideoViews]
        niconico: [VideoViews]
        bilibili: [VideoViews]
    }

    type EntityViews {
        timestamp: String
        total: Float!
        breakdown: EntityViewsBreakdown
    }

    type SongPlacement {
        allTime: Int
        releaseYear: Int
    }

    type ArtistPlacement {
        allTime: Int
    }

    type ArtistThumbnail {
        type: ArtistThumbnailType
        url: String
    }

    type Artist {
        id: ID!
        type: ArtistType
        category: ArtistCategory
        publishDate: String
        additionDate: String
        names: EntityNames
        thumbnails: [ArtistThumbnail]
        baseArtist: Artist
        averageColor: String
        darkColor: String
        lightColor: String
        views(timestamp: String): EntityViews
        placement(timestamp: String): ArtistPlacement
    }

    type Song {
        id: ID!
        publishDate: String
        additionDate: String
        type: SongType
        thumbnail: String
        maxresThumbnail: String
        averageColor: String
        darkColor: String
        lightColor: String
        fandomUrl: String
        artists: [Artist]
        names: EntityNames
        videoIds: SongVideoIds
        views(timestamp: String): EntityViews
        placement(timestamp: String): SongPlacement
        thumbnailType: ViewType
        displayThumbnail: String
        maxresDisplayThumbnail: String
    }

    type Query {
        Song(id: Int): Song
        Artist(id: Int): Artist
    }
`

var resolvers = {
    Query: {
        Song: async (_, { id }, context, info) => {
            // get song data
            const selections = info.fieldNodes[0].selectionSet.selections

            const querySelections = {}

            selections.forEach(selection => {
                const songRowEnum = SongRows.map[selection.name.value]
                if (songRowEnum) {
                    querySelections[songRowEnum.id] = true
                }
            });

            return new Song(await songsDataProxy.getSongSelective(id, querySelections))
        },
        Artist: async (_, { id }, context, info) => {
            // get song data
            const selections = info.fieldNodes[0].selectionSet.selections

            const querySelections = {}

            selections.forEach(selection => {
                const rowEnum = ArtistRows.map[selection.name.value]
                if (rowEnum) {
                    querySelections[rowEnum.id] = true
                }
            });

            return new Artist(await songsDataProxy.getArtistSelective(id, querySelections))
        }
    }
}


exports.prefix = ""

exports.register = (fastify, opts, done) => {

    fastify.register(mercurius, {
        schema,
        resolvers
    })

    fastify.get('/', (request, reply) => {
        /*return reply.graphql(`{
            Song( id: 321205 ) {
                id
                publishDate
                additionDate
                type
                thumbnail
                maxresThumbnail
                averageColor
                lightColor
                darkColor
                fandomUrl
                artists {
                    id
                    type
                    category
                    publishDate
                    additionDate
                    names {
                        original
                        japanese
                        english
                        romaji
                    }
                    thumbnails {
                        type
                        url
                    }
                    baseArtist {
                        id
                    }
                    averageColor
                    darkColor
                    lightColor
                    views {
                        timestamp
                        total
                        breakdown {
                            youtube {
                                id
                                views
                            }
                            niconico {
                                id
                                views
                            }
                            bilibili {
                                id
                                views
                            }
                        }
                    }
                    placement {
                        allTime
                    }
                }
                names {
                    original
                    japanese
                    english
                    romaji
                }
                videoIds {
                    youtube
                    niconico
                    bilibili
                }
                views {
                    timestamp
                    total
                    breakdown {
                        youtube {
                            id
                            views
                        }
                        niconico {
                            id
                            views
                        }
                        bilibili {
                            id
                            views
                        }
                    }
                }
                placement {
                    allTime
                    releaseYear
                }
                thumbnailType
                displayThumbnail
                maxresDisplayThumbnail
            }
        }`)*/
        /*return reply.graphql(`{
            Artist(id: 1) {
                id
                type
                category
                publishDate
                additionDate
                names {
                    original
                    japanese
                    english
                    romaji
                }
                thumbnails {
                    type
                    url
                }
                baseArtist {
                    id
                }
                averageColor
                darkColor
                lightColor
                views {
                    timestamp
                    total
                    breakdown {
                        youtube {
                            id
                            views
                        }
                        niconico {
                            id
                            views
                        }
                        bilibili {
                            id
                            views
                        }
                    }
                }
                placement {
                    allTime
                }
            }
        }`)*/
        return reply.graphql(`{
            Artist(id: 21165) {
                id
                views (timestamp: "2023-01-01") {
                    timestamp
                    total
                    breakdown {
                        youtube {
                            views
                        }
                        niconico {
                            views
                        }
                        bilibili {
                            views
                        }
                    }
                }
                placement (timestamp: "2023-01-01") {
                    allTime
                }
            }
        }`).catch(error => {
            return {
                statusCode: error.statusCode,
                code: error.code,
                errors: error.errors
            }
        }) //request.query['query'] || '')
    })

    done()

}