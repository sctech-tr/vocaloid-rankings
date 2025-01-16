export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs' && typeof window === 'undefined' ) {
        // const { refreshViewsV2 } = await import("./data/songsData");
        // console.log("refreshing views")
        // refreshViewsV2()
        const { refreshAllSongsViews } = await import("./data/songsData");
        refreshAllSongsViews().catch(error => console.log(`Error when refreshing every songs' views: ${error}`))
    }
}