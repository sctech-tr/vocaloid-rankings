import { RankingsViewMode } from "@/app/[lang]/rankings/types"
import { RankingsList } from "./rankings-list"
import { RankingsGrid } from "./rankings-grid"

export function RankingsContainer(
    {
        viewMode,
        columnsClassName,
        children
    }: {
        viewMode: RankingsViewMode
        columnsClassName?: string
        children: JSX.Element[] | JSX.Element
    }
) {
    return viewMode == RankingsViewMode.LIST ? <RankingsList>{children}</RankingsList> : <RankingsGrid columnsClassName={columnsClassName}>{children}</RankingsGrid>
}