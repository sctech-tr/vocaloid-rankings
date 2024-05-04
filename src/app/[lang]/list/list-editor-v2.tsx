'use client'
import { InputFilterElement } from "@/components/filter/input-filter";
import Image from "@/components/image";
import { LocalizedTextInput } from "@/components/input/localized-text-input";
import { Divider } from "@/components/material/divider";
import { FilledButton } from "@/components/material/filled-button";
import { Icon } from "@/components/material/icon";
import { IconButton } from "@/components/material/icon-button";
import { useLocale } from "@/components/providers/language-dictionary-provider";
import { Id, List, ListLocalizations } from "@/data/types";
import { getImageMostVibrantColor } from "@/lib/material/material";
import { Locale } from "@/localization";
import { LangLocaleTokens } from "@/localization/DictionaryTokenMaps";
import { Palette } from "color-thief-node";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface ListValues {
    id: Id | null;
    songIds: Id[];
    names: ListLocalizations;
    descriptions: ListLocalizations;
    image: string | null;
}

export function ListEditor(
    {
        list
    }: {
        list?: List
    }
) {
    // states
    const [listValues, setListValues] = useState({
        id: list?.id || null,
        songIds: list?.songIds || [] as Id[],
        names: list?.names || {} as ListLocalizations,
        descriptions: list?.names || {} as ListLocalizations,
        image: list?.image || null
    } as ListValues)
    const [formSubmitting, setFormSubmitting] = useState(false)
    const [error, setError] = useState(null as string | null)

    // language dictionary
    const langDict = useLocale()

    // router
    const router = useRouter()

    // functions
    const saveListValues = (
        newValues: ListValues
    ) => {
        setListValues({ ...newValues })
    }

    // generate language options
    const languageOptions: string[] = []
    const languageOptionsMap: { [key: number]: Locale } = {}

    // generate names & descriptions elements
    const nameElements: React.ReactNode[] = []
    const descriptionElements: React.ReactNode[] = []

    for (const locale in LangLocaleTokens) {
        const localizedName = langDict[LangLocaleTokens[locale as Locale]]
        languageOptionsMap[languageOptions.length] = locale as Locale
        languageOptions.push(localizedName)

        const nameValue = listValues.names[locale as Locale]
        if (nameValue !== undefined) {
            nameElements.push(
                <tr>
                    <td className="font-normal text-xl w-fit pr-5 pb-5">{localizedName}</td>
                    <td className="pb-5 w-full">
                        <InputFilterElement
                            type='text'
                            value={listValues.names[locale as Locale] || ''}
                            placeholder={langDict.list_names_placeholder}
                            defaultValue=""
                            onValueChanged={(newValue) => {
                                listValues.names[locale as Locale] = newValue
                                saveListValues(listValues)
                            }}
                            className="w-full"
                        />
                    </td>
                    <td className="pb-5 pl-3">
                        <IconButton
                            icon='delete'
                            onClick={event => {
                                // prevent the click form submitting the form
                                event.preventDefault()

                                listValues.names[locale as Locale] = undefined
                                saveListValues(listValues)
                            }}
                        />
                    </td>
                </tr>
            )
        }

        const descValue = listValues.descriptions[locale as Locale]
        if (descValue !== undefined) {
            descriptionElements.push(
                <tr>
                    <td className="font-normal text-xl w-fit pr-5 pb-5">{localizedName}</td>
                    <td className="pb-5 w-full">
                        <InputFilterElement
                            type='text'
                            value={listValues.descriptions[locale as Locale] || ''}
                            placeholder={langDict.list_descriptions_placeholder}
                            defaultValue=""
                            onValueChanged={(newValue) => {
                                listValues.descriptions[locale as Locale] = newValue
                                saveListValues(listValues)
                            }}
                            className="w-full"
                        />
                    </td>
                    <td className="pb-5 pl-3">
                        <IconButton
                            icon='delete'
                            onClick={event => {
                                // prevent the click form submitting the form
                                event.preventDefault()

                                listValues.descriptions[locale as Locale] = undefined
                                saveListValues(listValues)
                            }}
                        />
                    </td>
                </tr>
            )
        }
    }



    return (
        <form className="flex flex-col gap-5 w-full min-h-screen">
            <section className="w-full flex gap-5 items-end">
                <h1 className="font-bold md:text-5xl md:text-left text-4xl flex-1">{langDict.list_create_title}</h1>
                <FilledButton text={langDict.list_save} disabled={formSubmitting} />
            </section>

            <Divider />

            {/* image */}
            <h2 className="font-semibold text-3xl">{langDict.list_image_title}</h2>
            <section className="flex flex-col gap-3">
                {listValues.image && URL.canParse(listValues.image)
                    ? <figure className="rounded-3xl overflow-hidden bg-surface-container w-full flex items-center justify-center relative">
                        <Image
                            className="absolute w-full opacity-30 blur-2xl object-cover flex items-center justify-center"
                            src={listValues.image}
                            alt={langDict.list_image_title}
                        />
                        <Image
                            className="z-10 w-full max-w-96 aspect-square object-cover flex items-center justify-center"
                            src={listValues.image}
                            alt={langDict.list_image_title}
                        />
                    </figure>
                    : <div className="w-full h-full aspect-square max-w-96 rounded-3xl bg-surface-container-low flex items-center justify-center">
                        <Icon className="text-surface-variant" icon='image' />
                    </div>}
                <InputFilterElement
                    type='url'
                    value={listValues.image || ''}
                    placeholder={langDict.list_image_placeholder}
                    className="w-full max-w-96"
                    defaultValue=""
                    onValueChanged={(newImage) => {
                        listValues.image = newImage
                        saveListValues(listValues)
                    }}
                />
            </section>

            <Divider />

            <section className="flex md:flex-row flex-col gap-10">

                {/* names */}
                <LocalizedTextInput
                    values={listValues.names}
                    placeholder={langDict.list_names_placeholder}
                    emptyText={langDict.list_names_required}
                    title={langDict.list_names_title}
                    onValueChanged={(key, newValue) => {
                        listValues.names[key] = newValue
                        saveListValues(listValues)
                    }}
                />

                {/* descriptions */}
                <LocalizedTextInput
                    values={listValues.descriptions}
                    placeholder={langDict.list_descriptions_placeholder}
                    emptyText={langDict.list_descriptions_required}
                    title={langDict.list_descriptions_title}
                    onValueChanged={(key, newValue) => {
                        listValues.descriptions[key] = newValue
                        saveListValues(listValues)
                    }}
                />


            </section>


        </form>
    )
}