const { videoSource, imageFacet, animeSeason, resourceSite, themeType, videoOverlap } = require("lib/server/animethemes/enums");

const knex = require("knex")({
    client: "mysql2",
    connection: {
        host: process.env.DB_HOST || "127.0.0.1",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE || "animethemes"
    }
});

module.exports = {
    Query: {
        anime: (_, { id, slug }) => knex("anime")
            .where((builder) => {
                if (id) {
                    builder.where("anime_id", id);
                }
                if (slug) {
                    builder.where("slug", slug);
                }
            })
            .first(),
        animeAll: (_, { limit, year, season }) => {
            const query = knex("anime");

            if (year) {
                query.where("year", year);
            }
            if (season) {
                query.where(
                    "season",
                    [ ...animeSeason.values() ]
                        .findIndex((seasonName) => seasonName.toLowerCase() === season.toLowerCase())
                );
            }

            if (limit) {
                query.limit(limit);
            }

            return query.select();
        },
        theme: (_, { id }) => knex("anime_themes")
            .where((builder) => {
                if (id) {
                    builder.where("theme_id", id);
                }
            })
            .first(),
        themeAll: (_, { limit, orderBy, orderDesc }) => {
            const query = knex("anime_themes");

            if (orderBy) {
                query.orderBy(orderBy, orderDesc ? "desc" : "asc");
            }

            if (limit) {
                query.limit(limit);
            }

            return query.select();
        },
        artist: (_, { id, slug }) => knex("artists")
            .where((builder) => {
                if (id) {
                    builder.where("artist_id", id);
                }
                if (slug) {
                    builder.where("slug", slug);
                }
            })
            .first(),
        artistAll: (_, { limit }) => {
            const query = knex("artists");

            if (limit) {
                query.limit(limit);
            }

            return query.select();
        },
        series: (_, { id, slug }) => knex("series")
            .where((builder) => {
                if (id) {
                    builder.where("series_id", id);
                }
                if (slug) {
                    builder.where("slug", slug);
                }
            })
            .first(),
        seriesAll: (_, { limit }) => {
            const query = knex("series");

            if (limit) {
                query.limit(limit);
            }

            return query.select();
        },
        studio: (_, { id, slug }) => knex("studios")
            .where((builder) => {
                if (id) {
                    builder.where("studio_id", id);
                }
                if (slug) {
                    builder.where("slug", slug);
                }
            })
            .first(),
        studioAll: (_, { limit }) => {
            const query = knex("studios");

            if (limit) {
                query.limit(limit);
            }

            return query.select();
        },
        year: (_, { value }) => ({ value }),
        yearAll: () => knex("anime")
            .groupBy("year")
            .select("year")
            .then((results) => results.map((anime) => ({ value: anime.year }))),
        season: (_, { value, year }) => ({
            value: [ ...animeSeason.values() ]
                .findIndex((seasonName) => seasonName.toLowerCase() === value.toLowerCase()),
            year: { value: year }
        }),
        seasonAll: (_, { year }) => knex("anime")
            .where((builder) => {
                if (year) {
                    builder.where("year", year);
                }
            })
            .groupBy([ "season", "year" ])
            .select([ "season", "year" ])
            .then((results) => results.map((anime) => ({ value: anime.season, year: { value: year } }))),
    },
    Year: {
        seasons: (year) =>  knex("anime")
            .where("year", year.value)
            .groupBy("season")
            .select("season")
            .then((results) => results.map((anime) => ({ value: anime.season, year }))),
    },
    Season: {
        value: (season) => animeSeason.get(season.value),
        anime: (season) => knex("anime")
            .where((builder) => {
                builder.where("season", season.value);

                if (season.year) {
                    builder.where("year", season.year.value);
                }
            })
            .select(),
    },
    Anime: {
        id: (anime) => anime.anime_id,
        season: (anime) => animeSeason.get(anime.season),
        synonyms: (anime) => knex("anime_synonyms").where({ anime_id: anime.anime_id }).select(),
        themes: (anime) => knex("anime_themes").where({ anime_id: anime.anime_id }).select(),
        series: (anime) => knex("series")
            .innerJoin("anime_series", "anime_series.series_id", "series.series_id")
            .where({ "anime_series.anime_id": anime.anime_id })
            .select("series.*"),
        studios: (anime) => knex("studios")
            .innerJoin("anime_studio", "anime_studio.studio_id", "studios.studio_id")
            .where({ "anime_studio.anime_id": anime.anime_id })
            .select("studios.*"),
        resources: (anime) => knex("resources")
            .innerJoin("anime_resource", "anime_resource.resource_id", "resources.resource_id")
            .where({ "anime_resource.anime_id": anime.anime_id })
            .select("resources.*"),
        images: (anime) => knex("images")
            .innerJoin("anime_image", "anime_image.image_id", "images.image_id")
            .where({ "anime_image.anime_id": anime.anime_id })
            .select("images.*")
    },
    Theme: {
        type: (theme) => themeType.get(theme.type),
        sequence: (theme) => theme.sequence || 0,
        song: (theme) => knex("songs").where({ song_id: theme.song_id }).first(),
        anime: (theme) => knex("anime").where({ anime_id: theme.anime_id }).first(),
        entries: (theme) => knex("anime_theme_entries").where({ theme_id: theme.theme_id }).select()
    },
    Artist: {
        performances: (artist) => knex("artist_song").where({ artist_id: artist.artist_id }).select(),
        resources: (artist) => knex("resources")
            .innerJoin("artist_resource", "artist_resource.resource_id", "resources.resource_id")
            .where({ "artist_resource.artist_id": artist.artist_id })
            .select("resources.*"),
        images: (artist) => knex("images")
            .innerJoin("artist_image", "artist_image.image_id", "images.image_id")
            .where({ "artist_image.artist_id": artist.artist_id })
            .select("images.*")
    },
    Song: {
        themes: (song) => knex("anime_themes").where({ song_id: song.song_id }).select(),
        performances: (song) => knex("artist_song").where({ song_id: song.song_id }).select(),
    },
    Performance: {
        artist: (performance) => knex("artists").where({ artist_id: performance.artist_id }).first(),
        song: (performance) => knex("songs").where({ song_id: performance.song_id }).first()
    },
    Entry: {
        version: (entry) => entry.version || 1,
        videos: (entry) => knex("videos")
            .innerJoin("anime_theme_entry_video", "anime_theme_entry_video.video_id", "videos.video_id")
            .where({ "anime_theme_entry_video.entry_id": entry.entry_id })
            .select("videos.*")
    },
    Video: {
        source: (video) => videoSource.get(video.source),
        overlap: (video) => videoOverlap.get(video.overlap),
        tags: (video) => {
            const tags = [];

            if (video.nc) {
                tags.push("NC");
            }
            if (video.source === 2 || video.source === 3) {
                tags.push(videoSource.get(video.source));
            }
            if (video.resolution && video.resolution !== 720) {
                tags.push(video.resolution);
            }

            if (video.subbed) {
                tags.push("Subbed");
            } else if (video.lyrics) {
                tags.push("Lyrics");
            }

            return tags.join("");
        }
    },
    Image: {
        facet: (image) => imageFacet.get(image.facet),
        link: (image) => `https://staging.animethemes.moe/image/${image.image_id}`
    },
    Resource: {
        site: (resource) => resourceSite.get(resource.site)
    },
    Series: {
        anime: (series) => knex("anime")
            .innerJoin("anime_series", "anime_series.anime_id", "anime.anime_id")
            .where({ "anime_series.series_id": series.series_id })
            .select("anime.*")
    },
    Studio: {
        anime: (studio) => knex("anime")
            .innerJoin("anime_studio", "anime_studio.anime_id", "anime.anime_id")
            .where({ "anime_studio.studio_id": studio.studio_id })
            .select("anime.*"),
        resources: (studio) => knex("resources")
            .innerJoin("studio_resource", "studio_resource.resource_id", "resources.resource_id")
            .where({ "studio_resource.studio_id": studio.studio_id })
            .select("resources.*")
    },
    BracketCharacter: {
        theme: (character) => knex("anime_themes")
            .where("theme_id", character.theme)
            .first()
    }
};