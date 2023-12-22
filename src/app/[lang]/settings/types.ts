import { NameType } from "@/data/types";
import { RankingsViewMode } from "../rankings/types";

export enum Theme {
    SYSTEM,
    LIGHT,
    DARK
}

export interface InitialSettings {
    titleLanguage: number
    rankingsViewMode: number
    theme: number
    googleAnalytics: boolean
}

export interface RawSettings {
    titleLanguage: NameType
    rankingsViewMode: RankingsViewMode
    theme: Theme,
    googleAnalytics: boolean
}

export interface SettingsProxy {
    get titleLanguage(): NameType

    get rankingsViewMode(): RankingsViewMode

    get googleAnalytics(): boolean

    get theme(): Theme

    set titleLanguage(newTitleLanguage: NameType)

    set rankingsViewMode(newRankingsViewMode: RankingsViewMode)

    set googleAnalytics(enabled: boolean)
}

export interface UseSettingsProps {
    settings: RawSettings

    setTitleLanguage: (newTitleLanguage: NameType) => void
    setRankingsViewMode: (newViewMode: RankingsViewMode) => void
    setTheme: (newTheme: Theme) => void
    setGoogleAnalytics: (enabled: boolean) => void
}

export interface SettingsProviderProps {
    cookieName?: string
    
    cookieExpires?: Date

    defaultSettings?: RawSettings

    children?: React.ReactNode
}