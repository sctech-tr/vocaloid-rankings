const Database = require("better-sqlite3")
const Artist = require("../dataClasses/Artist")
const ArtistThumbnail = require("../dataClasses/ArtistThumbnail")
const Song = require("../dataClasses/song")
const SongViews = require("../dataClasses/SongViews")
const ArtistThumbnailType = require("../enums/ArtistThumbnailType")
const ArtistType = require("../enums/ArtistType")
const SongType = require("../enums/SongType")

const { generateTimestamp } = require("../../server_scripts/shared")
const ArtistCategory = require("../enums/ArtistCategory")
const RankingsFilterResultItem = require("../dataClasses/RankingsFilterResultItem")
const RankingsFilterParams = require("../dataClasses/RankingsFilterParams")
const PlacementChange = require("../enums/PlacementChange")
const RankingsFilterResult = require("../dataClasses/RankingsFilterResult")

function generateISOTimestamp() {
    return new Date().toISOString()
}

module.exports = class SongsDataProxy {

    /**
     * Creates a new SongsDataProxy
     * 
     * @param {Database.Database} db The db for this proxy to use.
     */
    constructor(db) {
        this.db = db
    }

    // private functions

    /**
     * Builds an Artist object and returns it using data provided from the database.
     * 
     * @param {Object} artistData 
     * @param {Object[]} artistNames 
     * @param {Object[]} artistThumbnails 
     * @returns {Artist} The built Artist object.
     */
    #buildArtist(
        artistData,
        artistNames,
        artistThumbnails
    ) {
        // process names
        const names = []
        for (const [_, nameData] of artistNames.entries()) {
            names[nameData.name_type] = nameData.name
        }

        // process thumbnails
        const thumbnails = []
        for (const [_, thumbnailData] of artistThumbnails.entries()) {
            const thumbType = thumbnailData.thumbnail_type
            thumbnails[thumbType] = new ArtistThumbnail(
                ArtistThumbnailType.fromId(thumbType),
                thumbnailData.url,
                thumbnailData.average_color
            )
        }

        return new Artist(
            artistData.id,
            ArtistType.fromId(artistData.artist_type),
            null,
            artistData.publish_date,
            artistData.addition_date,
            names,
            thumbnails,
            artistData.base_artist_id
        )
    }

    /**
     * Builds an Song object and returns it using data provided from the database.
     * 
     * @param {Object} songData 
     * @param {Object[]} songNames 
     * @param {Artist[]} songArtists
     * @param {SongViews=} songViews
     * @returns {Song} The built Song object.
     */
    #buildSong(
        songData,
        songNames,
        songArtists,
        songVideoIds,
        songViews
    ) {
        // process names
        const names = []
        for (const [_, nameData] of songNames.entries()) {
            names[nameData.name_type] = nameData.name
        }
        // process video ids
        const videoIds = []
        for (const [_, videoIdData] of songVideoIds.entries()) {
            const type = videoIdData.video_type
            // get bucket
            let bucket = videoIds[type]
            if (!bucket) {
                bucket = []
                videoIds[type] = bucket
            }
            // add video id to bucket
            bucket.push(videoIdData.video_id)
        }
        // build song
        return new Song(
            songData.id,
            songData.publish_date,
            songData.addition_date,
            SongType.fromId(songData.song_type),
            songData.thumbnail,
            songData.maxres_thumbnail,
            songData.average_color,
            songData.dark_color,
            songData.light_color,
            songData.fandom_url,
            songArtists,
            names,
            videoIds,
            songViews
        )
    }

    /**
     * Builds an SongViews object using data provided from the database.
     * 
     * @param {Object} viewsTotal
     * @param {Object[]} viewsBreakdowns 
     * @returns {SongViews} The built SongViews object.
     */
    #buildSongViews(
        viewsTotal,
        viewsBreakdowns
    ) {
        // process breakdown
        const breakdown = []
        for (const [_, breakdownData] of viewsBreakdowns.entries()) {
            const type = breakdownData.view_type
            let bucket = breakdown[type]
            if (!bucket) {
                bucket = {}
                breakdown[type] = bucket
            }
            // add breakdown to bucket
            bucket[breakdownData.video_id] = breakdownData.views
        }

        return new SongViews(
            viewsTotal.song_id,
            viewsTotal.timestamp,
            viewsTotal.total,
            breakdown
        )
    }

    /**
     * Synchronously gets the views for the song associated with the provided song id.
     * Returns null if the song does not exist.
     * 
     * @param {number} songId The ID of the song to get.
     * @param {string} [timestamp]
     * @returns {SongViews|null} The SongViews associated with songId or null.
     */
    #getSongViewsSync(
        songId,
        timestamp = this.#getMostRecentViewsTimestampSync()
    ) {
        const db = this.db

        // get views totals
        const viewsTotal = db.prepare(`
        SELECT song_id, timestamp, total
        FROM views_totals
        WHERE song_id = ? AND timestamp = ?`).get(songId, timestamp)

        if (viewsTotal == undefined) { return null }

        const breakdowns = db.prepare(`
        SELECT views, video_id, view_type
        FROM views_breakdowns
        WHERE song_id = ? AND timestamp = ?`).all(songId, timestamp)

        return this.#buildSongViews(
            viewsTotal,
            breakdowns
        )
    }

    /**
     * Synchronously gets the artist associated with the provided artist id.
     * Returns null if the artist does not exist.
     * 
     * @param {number} artistId The ID of the artist to get.
     * @returns {Artist|null} The artist associated with artistId
     */
    #getArtistSync(
        artistId
    ) {
        const db = this.db

        const artistData = db.prepare(`
        SELECT id, artist_type, publish_date, addition_date, base_artist_id
        FROM artists
        WHERE id = ?`).get(artistId)

        // return null if the artist doesn't exist.
        if (artistData == undefined) { return null }

        const artistNames = db.prepare(`
        SELECT name, name_type
        FROM artists_names
        WHERE artist_id = ?`).all(artistId)

        const artistThumbnails = db.prepare(`
        SELECT thumbnail_type, url, average_color
        FROM artists_thumbnails
        WHERE artist_id = ?`).all(artistId)

        return this.#buildArtist(
            artistData,
            artistNames,
            artistThumbnails
        )
    }

    /**
     * Synchronously gets the song associated with the provided song id.
     * Returns null if the song does not exist.
     * 
     * @param {number} songId The ID of the song to get.
     * @param {boolean} [getViews] Whether or not to get the views for this song as well.
     * @returns {Song|null} The song associated with songId
     */
    #getSongSync(
        songId,
        getViews = true
    ) {
        const db = this.db

        const songData = db.prepare(`
        SELECT id, publish_date, addition_date, song_type, thumbnail, maxres_thumbnail, average_color, dark_color, light_color, fandom_url
        FROM songs
        WHERE id = ?`).get(songId)
                
        // resolve with null if the song was not found
        if (songData == undefined) { return null }

        // get names
        const songNames = db.prepare(`
        SELECT name, name_type 
        FROM songs_names
        WHERE song_id = ?`).all(songId)

        // get song artists
        const songArtists = db.prepare(`
        SELECT artist_id, artist_category
        FROM songs_artists
        WHERE song_id = ?`).all(songId)

        // get video ids
        const songVideoIds = db.prepare(`
        SELECT video_id, video_type
        FROM songs_video_ids
        WHERE song_id = ?`).all(songId)

        // get artists data
        const artists = []
        for (const [_, songArtist] of songArtists.entries()) {
            const artist = this.#getArtistSync(songArtist.artist_id)
            artist.category = ArtistCategory.fromId(songArtist.artist_category)
            artists.push(artist)
        }

        return this.#buildSong(
            songData,
            songNames,
            artists,
            songVideoIds,
            getViews ? this.#getSongViewsSync(songId) : null
        )
    }

    /**
     * Gets the most recent views timestamp within the database.
     * 
     * @returns {string=} The most recent views timestamp
     */
    #getMostRecentViewsTimestampSync() {
        const result =  this.db.prepare(`
        SELECT timestamp
        FROM views_metadata
        ORDER BY timestamp DESC
        LIMIT 1`).get()
        return result ? result.timestamp : null
    }

    /**
     * Gets every views timestamp within the database
     * 
     * @returns {Object[]} An array of objects containing the timestamps.
     */
    #getViewsTimestamps() {
        const result = this.db.prepare(`
        SELECT timestamp
        FROM views_metadata
        ORDER BY timestamp DESC`).all()
        return result || []
    }

    /**
     * Synchronously checks whether the provided timestamp exists within the views_metadata table.
     * 
     * @param timestamp The timestamp to check the existence of.
     * @returns {boolean} Whether the provided timestamp exists or not
     */
    #timestampExistsSync(timestamp) {
        return this.db.prepare(`
        SELECT timestamp 
        FROM views_metadata 
        WHERE timestamp = ? 
        LIMIT 1`).get(timestamp) ? true : false
    }

    /**
     * Gets an artist's base artist if it exists.
     * 
     * @param {number} artistId The id of the artist to get the base artist of.
     * @param {string} artistName The name of the artist to get the base artist of.
     * @returns {number?}
     */
    #getBaseArtistSync(artistId, artistName) {
        const result = this.db.prepare(`
        SELECT DISTINCT artists.id
        FROM artists
        JOIN artists_names ON artists.id = artists_names.artist_id
        WHERE INSTR(?, artists_names.name)
        ORDER BY artists.id ASC
        LIMIT 1`).get(artistName)
        const baseArtistId = result ? result.id : artistId
        return baseArtistId != artistId ? baseArtistId : null 
    }
    
    /**
     * Turns the provided RankingsFilterParams object into an object readable by better sqlite3.
     * 
     * @param {RankingsFilterParams} filterParams 
     * @param {number} [daysOffset] 
     * @returns {Object}
     */
    #getFilterRankingsQueryParams(filterParams, daysOffset) {
        const queryParams = {
            timestamp: filterParams.timestamp || this.#getMostRecentViewsTimestampSync(),
            timePeriodOffset: filterParams.timePeriodOffset,
            daysOffset: daysOffset == null ? filterParams.daysOffset : daysOffset + filterParams.daysOffset,
            viewType: filterParams.viewType?.id,
            songType: filterParams.songType?.id,
            artistType: filterParams.artistType?.id,
            publishDate: filterParams.publishDate,
            orderBy: filterParams.orderBy?.id,
            direction: filterParams.direction?.id,
            singleVideo: filterParams.singleVideo,
            maxEntries: filterParams.maxEntries,
            startAt: filterParams.startAt
        }

        // build artists statement
        const filterParamsArtists = filterParams.artists
        let filterArtists = ''
        if (filterParamsArtists) {
            const artists = []
            for (const [n, artistId] of filterParamsArtists.entries()) {
                const key = `artist${n}`
                artists.push(`:${key}`)
                queryParams[key] = artistId
            }
            filterArtists = artists.join(',')
        }

        return {
            filterArtists: filterArtists,
            params: queryParams
        }
    }

    /**
     * Filters rankings and returns the number of rankings entries.
     * 
     * @param {Object} queryParams The parameters to filter by.
     * @returns {number} The number of entires.
     */
    #filterRankingsCountSync(queryParams) {
        const filterArtists = queryParams.filterArtists
        return this.db.prepare(`
        SELECT count(DISTINCT views_breakdowns.song_id) AS count
        FROM views_breakdowns
        INNER JOIN songs ON views_breakdowns.song_id = songs.id
        INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
        INNER JOIN artists ON artists.id = songs_artists.artist_id
        WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
                THEN :timestamp
                ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
                END)
            AND (views_breakdowns.view_type = :viewType OR :viewType IS NULL)
            AND (songs.song_type = :songType OR :songType IS NULL)
            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
            AND (artists.artist_type = :artistType OR :artistType IS NULL)
            AND (views_breakdowns.views = CASE WHEN :singleVideo IS NULL
                THEN views_breakdowns.views
                ELSE
                    (SELECT MAX(sub_vb.views)
                    FROM views_breakdowns AS sub_vb 
                    INNER JOIN songs ON songs.id = sub_vb.song_id
                    INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                    WHERE (sub_vb.view_type = views_breakdowns.view_type)
                        AND (sub_vb.timestamp = views_breakdowns.timestamp)
                        AND (sub_vb.song_id = views_breakdowns.song_id)
                        AND (songs.song_type = :songType OR :songType IS NULL)
                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                        AND (artists.artist_type = :artistType OR :artistType IS NULL)
                        ${filterArtists == '' ? '' : `AND (songs_artists.artist_id IN (${filterArtists}) OR artists.base_artist_id IN (${filterArtists}))`}
                    GROUP BY sub_vb.song_id)
                END)
            ${filterArtists == '' ? '' : `AND (songs_artists.artist_id IN (${filterArtists}) OR artists.base_artist_id IN (${filterArtists}))`}
        `).get(queryParams.params)?.count
    }

    /**
     * Filters rankings and returns the filtered rankings entires.
     * This function is a companion to #filterRankingsSync() and shouldn't be used alone.
     * Returns raw data from the database instead of RankingsFilterResultItem objects.
     * 
     * @param {Object} queryParams The parameters to filter by.
     * @returns {Object[]} The raw data from the database containing song ids and view totals.
     */
    #filterRankingsRawSync(queryParams) {
        const filterArtists = queryParams.filterArtists
        return this.db.prepare(`
        SELECT DISTINCT views_breakdowns.song_id,
            SUM(DISTINCT views_breakdowns.views) - CASE WHEN :timePeriodOffset IS NULL
                THEN 0
                ELSE ifnull((
                    SELECT SUM(DISTINCT offset_breakdowns.views)
                    FROM views_breakdowns AS offset_breakdowns
                    INNER JOIN songs ON songs.id = offset_breakdowns.song_id
                    INNER JOIN songs_artists ON songs_artists.song_id = offset_breakdowns.song_id
                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                    WHERE (offset_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
                            THEN DATE(:timestamp, '-' || :timePeriodOffset || ' day')
                            ELSE DATE(DATE(:timestamp, '-' || :daysOffset || ' day'), '-' || :timePeriodOffset || ' day')
                            END)
                        AND (offset_breakdowns.song_id = views_breakdowns.song_id)
                        AND (offset_breakdowns.view_type = :viewType OR :viewType IS NULL)
                        AND (songs.song_type = :songType OR :songType IS NULL)
                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                        AND (artists.artist_type = :artistType OR :artistType IS NULL)
                        AND (offset_breakdowns.views = CASE WHEN :singleVideo IS NULL
                            THEN offset_breakdowns.views
                            ELSE
                                (SELECT MAX(offset_sub_breakdowns.views)
                                FROM views_breakdowns AS offset_sub_breakdowns 
                                INNER JOIN songs ON songs.id = offset_sub_breakdowns.song_id
                                INNER JOIN songs_artists ON songs_artists.song_id = offset_sub_breakdowns.song_id
                                INNER JOIN artists ON artists.id = songs_artists.artist_id
                                WHERE (offset_sub_breakdowns.view_type = offset_breakdowns.view_type)
                                    AND (offset_sub_breakdowns.timestamp = offset_breakdowns.timestamp)
                                    AND (offset_sub_breakdowns.song_id = offset_breakdowns.song_id)
                                    AND (songs.song_type = :songType OR :songType IS NULL)
                                    AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                                    AND (artists.artist_type = :artistType OR :artistType IS NULL)
                                    ${filterArtists == '' ? '' : `AND (songs_artists.artist_id IN (${filterArtists}) OR artists.base_artist_id IN (${filterArtists}))`}
                                GROUP BY offset_sub_breakdowns.song_id)
                            END)
                        ${filterArtists == '' ? '' : `AND (songs_artists.artist_id IN (${filterArtists}) OR artists.base_artist_id IN (${filterArtists}))`}
                    GROUP BY offset_breakdowns.song_id
                ),0)
            END AS total_views
        FROM views_breakdowns
        INNER JOIN songs ON views_breakdowns.song_id = songs.id
        INNER JOIN songs_artists ON songs_artists.song_id = views_breakdowns.song_id
        INNER JOIN artists ON artists.id = songs_artists.artist_id
        WHERE (views_breakdowns.timestamp = CASE WHEN :daysOffset IS NULL
                THEN :timestamp
                ELSE DATE(:timestamp, '-' || :daysOffset || ' day')
                END)
            AND (views_breakdowns.view_type = :viewType OR :viewType IS NULL)
            AND (songs.song_type = :songType OR :songType IS NULL)
            AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
            AND (artists.artist_type = :artistType OR :artistType IS NULL)
            AND (views_breakdowns.views = CASE WHEN :singleVideo IS NULL
                THEN views_breakdowns.views
                ELSE
                    (SELECT MAX(sub_vb.views)
                    FROM views_breakdowns AS sub_vb 
                    INNER JOIN songs ON songs.id = sub_vb.song_id
                    INNER JOIN songs_artists ON songs_artists.song_id = sub_vb.song_id
                    INNER JOIN artists ON artists.id = songs_artists.artist_id
                    WHERE (sub_vb.view_type = views_breakdowns.view_type)
                        AND (sub_vb.timestamp = views_breakdowns.timestamp)
                        AND (sub_vb.song_id = views_breakdowns.song_id)
                        AND (songs.song_type = :songType OR :songType IS NULL)
                        AND (songs.publish_date LIKE :publishDate OR :publishDate IS NULL)
                        AND (artists.artist_type = :artistType OR :artistType IS NULL)
                        ${filterArtists == '' ? '' : `AND (songs_artists.artist_id IN (${filterArtists}) OR artists.base_artist_id IN (${filterArtists}))`}
                    GROUP BY sub_vb.song_id)
                END)
            ${filterArtists == '' ? '' : `AND (songs_artists.artist_id IN (${filterArtists}) OR artists.base_artist_id IN (${filterArtists}))`}
        GROUP BY views_breakdowns.song_id
        ORDER BY
            CASE WHEN :direction = 0 THEN 1
            ELSE
                CASE :orderBy
                    WHEN 1 
                        THEN DATE(songs.publish_date)
                    WHEN 2 
                        THEN DATE(songs.addition_date)
                    ELSE total_views
                END
            END ASC,
            CASE WHEN :direction = 1 THEN 1
            ELSE
                CASE :orderBy
                    WHEN 1 
                        THEN DATE(songs.publish_date)
                    WHEN 2 
                        THEN DATE(songs.addition_date)
                    ELSE total_views
                END
            END DESC
        LIMIT :maxEntries
        OFFSET :startAt`).all(queryParams.params)
    }
    
    /**
     * Filters rankings and returns the filtered rankings entries.
     * 
     * @param {RankingsFilterParams} filterParams The parameters to filter by.
     * @returns {RankingsFilterResult} The filtered rankings entries.
     */
    #filterRankingsSync(filterParams) {
        const queryParams = this.#getFilterRankingsQueryParams(filterParams)

        const primaryResult = this.#filterRankingsRawSync(queryParams)
        // handle change offset
        const changeOffset = filterParams.changeOffset
        const changeOffsetMap = {}
        if (changeOffset > 0) {
            const changeOffsetResult = this.#filterRankingsRawSync(this.#getFilterRankingsQueryParams(filterParams,changeOffset))
            for (const [placement, data] of changeOffsetResult.entries()) {
                changeOffsetMap[data.song_id] = placement
            }
        }

        const returnEntries = []
        // generate rankings entries
        const placementOffset = filterParams.startAt
        for (const [placement, data] of primaryResult.entries()) {
            const songId = data.song_id
            const previousPlacement = changeOffsetMap[songId] || placement
            returnEntries.push(new RankingsFilterResultItem(
                placement + 1 + placementOffset,
                previousPlacement == placement ? PlacementChange.SAME : 
                    (placement > previousPlacement ? PlacementChange.DOWN : PlacementChange.UP), 
                previousPlacement,
                data.total_views,
                this.#getSongSync(songId, false)
            ))
        }

        // get entry count
        const entryCount = this.#filterRankingsCountSync(queryParams)

        return new RankingsFilterResult(
            entryCount,
            queryParams.params.timestamp,
            returnEntries
        )
    }

    // public functions

    /**
     * Gets an artist's base artist if it exists.
     * 
     * @param {number} artistId The id of the artist to get the base artist of.
     * @param {string} artistName The name of the artist to get the base artist of.
     * @returns {Promise<number?>} A promise that resolves with the output of this function.
     */
    getBaseArtist(
        artistId,
        artistName
    ) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getBaseArtistSync(artistId, artistName))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Checks if a song exists within the database.
     * 
     * @param {number} id The ID of the song to check the existence of.
     * @returns {Promise<Boolean>} A promise that resolves upon the completion of this function.
     */
    songExists(id) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.db.prepare('SELECT id FROM songs WHERE id = ? LIMIT 1').get(id) ? true : false)
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Checks if a artist exists within the database.
     * 
     * @param {number} id The ID of the artist to check the existence of.
     * @returns {Promise<Boolean>} A promise that resolves upon the completion of this function.
     */
    artistExists(id) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.db.prepare('SELECT id FROM artists WHERE id = ? LIMIT 1').get(id) ? true : false)
            } catch (error) {
                reject(error)
            }
        }) 
    }

    /**
     * Checks if the provided timestamp exists within the database.
     * 
     * @param {string} timestamp The timestamp to check the existence of.
     * @returns {Promise<Boolean>} A promise that resolves with the result of this function.
     */
    viewsTimestampExists(timestamp) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#timestampExistsSync(timestamp))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Gets every timestamp within the database.
     * 
     * @returns {Promise<Object[]>} A promise that resolves with the result of this function.
     */
    getViewsTimestamps() {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getViewsTimestamps())
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Asynchronously gets the most recent views timestamp.
     * 
     * @returns {Promise<string=>} A promise that resolves with the most recent timestamp or undefined if not timestamp exists.
     */
    getMostRecentViewsTimestamp() {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getMostRecentViewsTimestampSync())
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Asynchronously filters rankings and returns the filtered rankings entries.
     * 
     * @param {RankingsFilterParams} filterParams The parameters to filter by.
     * @returns {RankingsFilterResultItem[]} The filtered rankings entries.
     */
    filterRankings(filterParams) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#filterRankingsSync(filterParams))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Asynchronously gets a song from the database.
     * Returns null if no song was found.
     * 
     * @param {number} id The id of the song to get.
     * @returns {Promise<Song|null>} A promise that resolves with a Song or null.
     */
    getSong(id) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getSongSync(id))
            } catch (error) {
                reject(error)
            }
        })
    }

    getSongsIds() {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.db.prepare('SELECT id FROM songs').all())
            } catch (error) {
                reject(error)
            }
        })
    }
    
    /**
     * Asynchronously gets an artist from the database.
     * Returns nulls if no artist was found.
     * 
     * @param id The id of the artist to get.
     * @returns {Promise<Artist|null>} A promise that resolves with an Artist or null.
     */
    getArtist(id) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.#getArtistSync(id))
            } catch (error) {
                reject(error)
            }
        })
    }

    getArtistFromName(name) {
        return new Promise((resolve, reject) => {
            const db = this.db

            const id = db.prepare(`
            SELECT song_id
            FROM songs_names
            WHERE name = ?
            LIMIT 1`).get(name)

            if (id) {
                resolve(this.#getArtistSync(id))
            }

        })
    }

    /**
     * Inserts an artist into the database.
     * 
     * @param {Artist} artist The artist to insert.
     * @returns {Promise} A promise that resolves upon the artist being inserted.
     */
    insertArtist(artist) {
        return new Promise((resolve, reject) => {
            try {
                
                const db = this.db
                const artistId = artist.id

                // prepare statement to insert into artists
                const artistsInsertStatement = db.prepare(`
                REPLACE INTO artists (id, artist_type, publish_date, addition_date, base_artist_id)
                VALUES (?, ?, ?, ?, ?)`)
                // prepare statement to insert into artists names
                const artistsNamesInsertStatement = db.prepare(`
                REPLACE INTO artists_names (artist_id, name, name_type)
                VALUES (?, ?, ?)`)
                // prepare statement to insert into artists thumbnails
                const artistsThumnailsInsertStatement = db.prepare(`
                REPLACE INTO artists_thumbnails (thumbnail_type, url, artist_id, average_color)
                VALUES (?, ?, ?, ?)`)

                // insert artist into artists
                artistsInsertStatement.run(
                    artistId,
                    artist.type.id,
                    artist.publishDate,
                    artist.additionDate,
                    artist.baseArtistId
                )
                // insert names
                for (const [nameType, name] of Object.entries(artist.names)) {
                    if (name != undefined) {
                        artistsNamesInsertStatement.run(
                            artistId,
                            name,
                            nameType
                        )
                    }
                }
                // insert thumbnails
                for (const [thumbnailType, thumbnail] of Object.entries(artist.thumbnails)) {
                    artistsThumnailsInsertStatement.run(
                        thumbnailType,
                        thumbnail.url,
                        artistId,
                        thumbnail.averageColor
                    )
                }
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Inserts a new song into the database
     * 
     * @param {Song} song The song to insert.
     * @returns {Promise} A promise that resolves upon the completion of this function.
     */
    insertSong(song) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = this.db

                const songId = song.id

                // prepare statement to insert into songs
                const songsInsertStatement = db.prepare(`
                REPLACE INTO songs (id, publish_date, addition_date, song_type, thumbnail, maxres_thumbnail, average_color, dark_color, light_color, fandom_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)

                // prepare statement to insert into songs artists
                const songsArtistsInsertStatement = db.prepare(`
                REPLACE INTO songs_artists (song_id, artist_id, artist_category)
                VALUES (?, ?, ?)`)

                // prepare statement to insert into songs names
                const songsNamesInsertStatement = db.prepare(`
                REPLACE INTO songs_names (song_id, name, name_type)
                VALUES (?, ?, ?)`)

                // prepare statement to insert into songs video ids
                const songsVideoIdsInsertStatement = db.prepare(`
                REPLACE INTO songs_video_ids (song_id, video_id, video_type)
                VALUES (?, ?, ?)`)

                // insert into songs table
                songsInsertStatement.run(
                    songId,
                    song.publishDate,
                    song.additionDate,
                    song.type.id,
                    song.thumbnail,
                    song.maxresThumbnail,
                    song.averageColor,
                    song.darkColor,
                    song.lightColor,
                    song.fandomUrl
                )

                // insert artists into song artists table
                for (const [_, artist] of song.artists.entries()) {
                    const artistId = artist.id
                    if (!(await this.artistExists(artistId))) {
                        await this.insertArtist(artist)
                    }
                    const category = artist.category
                    songsArtistsInsertStatement.run(
                        songId,
                        artistId,
                        category ? category.id : 0
                    )
                }

                // insert names into songs names table
                for (const [nameType, name] of song.names.entries()) {
                    if (name != undefined) {
                        songsNamesInsertStatement.run(
                            songId,
                            name,
                            nameType
                        )
                    }
                }

                // insert video ids into songs video ids table
                for (const [viewType, bucket] of song.videoIds.entries()) {
                    if (bucket != undefined) {
                        for (const [_, videoId] of bucket.entries()) {
                            songsVideoIdsInsertStatement.run(
                                songId,
                                videoId,
                                viewType
                            )
                        }
                    }
                }

                // insert views
                const views = song.views
                const viewsTimestamp = views && views.timestamp
                if (viewsTimestamp) {
                    await this.insertSongViews(views)
                }

                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Inserts a new views timestamp into the views metadata table.
     * 
     * @param {string} timestamp The timestamp to insert into the views metadata.
     * @param {string} [updated] When this timestamp was last updated.
     * @returns {Promise} A promise that resolves upon insertion completion.
     */
    insertViewsTimestamp(timestamp, updated) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.db.prepare(`
                REPLACE INTO views_metadata (timestamp, updated)
                VALUES (?, ?)`).run (
                    timestamp,
                    updated || generateISOTimestamp()
                ))
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Inserts a song's views into the database.
     * 
     * @param {SongViews} songViews The views to insert into the database.
     * @returns {Promise} A promise that resolves upon insertion completion.
     */
    insertSongViews(songViews) {
        return new Promise((resolve, reject) => {
            try {
                const db = this.db
                const songId = songViews.songId
                // get the timestamp
                const timestamp = songViews.timestamp || this.#getMostRecentViewsTimestampSync() || generateTimestamp().Timestamp

                // prepare the views totals replace statement
                const viewsTotalsReplaceStatement = db.prepare(`
                REPLACE INTO views_totals (song_id, timestamp, total)
                VALUES (?, ?, ?)`)

                const viewsBreakdownsReplaceStatement = db.prepare(`
                REPLACE INTO views_breakdowns (song_id, timestamp, views, video_id, view_type)
                VALUES (?, ?, ?, ?, ?)`)
                
                viewsTotalsReplaceStatement.run(
                    songId,
                    timestamp,
                    songViews.total,
                )

                // insert breakdowns
                for (const [viewType, viewsBucket] of songViews.breakdown.entries()) {
                    if (viewsBucket) {
                        for (const [videoId, views] of Object.entries(viewsBucket)) {
                            viewsBreakdownsReplaceStatement.run(
                                songId,
                                timestamp,
                                views,
                                videoId,
                                viewType
                            )
                        }
                    }
                }
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }
}