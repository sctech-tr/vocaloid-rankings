'use client'
import { NameType } from '@/data/types'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { LanguageDictionary, Locale, getDictionary } from '@/localization'
import { useSettings } from '../../../components/providers/settings-provider'
import { NameTypeLocaleTokens } from '@/localization/DictionaryTokenMaps'
import { RankingsViewMode } from '../rankings/types'
import { Theme } from './types'

export default function SettingsPage(
  {
    params
  }: {
    params: {
      lang: Locale
    }
  }
) {
  const [mounted, setMounted] = useState(false)
  const { settings, setTitleLanguage, setRankingsViewMode, setTheme } = useSettings()
  const [langDict, setLangDict] = useState({} as LanguageDictionary)

  useEffect(() => {
    setMounted(true)
    getDictionary(params.lang).then(dict => setLangDict(dict))
  }, [])

  if (!mounted || !langDict) {
    return null
  }

  return (
    <div className=' gap-3 flex flex-col'>
      <div className='text-xl'>Theme: {settings.theme}</div>
      <select value={settings.theme} onChange={e => setTheme(Number.parseInt(e.target.value))}>
        <option value={Theme.SYSTEM}>System</option>
        <option value={Theme.DARK}>Dark</option>
        <option value={Theme.LIGHT}>Light</option>
      </select>
      <div className='text-xl'>Title language: {langDict[NameTypeLocaleTokens[settings.titleLanguage]]}</div>
      <select value={settings.titleLanguage} onChange={ e => setTitleLanguage((Number.parseInt(e.target.value))) }>
        <option value={NameType.ORIGINAL}>Native</option>
        <option value={NameType.ENGLISH}>English</option>
        <option value={NameType.ROMAJI}>Romaji</option>
      </select>
      <div className='text-xl'>Rankings View Mode: {settings.rankingsViewMode}</div>
      <select value={settings.rankingsViewMode} onChange={ e => setRankingsViewMode((Number.parseInt(e.target.value))) }>
        <option value={RankingsViewMode.LIST}>List</option>
        <option value={RankingsViewMode.GRID}>Grid</option>
      </select>
    </div>
  )
}