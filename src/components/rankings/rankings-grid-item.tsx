import Link from "next/link"
import SongThumbnail from "../song-thumbnail"
import { Transition, TransitionStatus } from "react-transition-group"
import { CSSProperties, useEffect, useRef, useState } from "react"
import Image from "next/image"

const transitionStyles: { [key in TransitionStatus]: CSSProperties } = {
    entering: {
        opacity: 1
    },
    entered: {
        opacity: 1
    },
    exiting: {
        opacity: 0
    },
    exited: {
        opacity: 0
    },
    unmounted: {
        opacity: 0
    }
}

export function RankingGridItem(
    {
        key,
        href,
        titleContent,
        placement,
        icon,
        iconAlt,
        trailingTitleContent,
        supportingContent,
        trailingSupporting,
        in: inProp = false,
        className = ''
    }: {
        key: string
        href: string
        titleContent: React.ReactNode
        placement: number
        icon: string
        iconAlt: string
        trailingTitleContent: React.ReactNode,
        supportingContent?: React.ReactNode
        trailingSupporting?: string,
        in?: boolean
        className?: string
    }
) {
    const nodeRef = useRef<HTMLLIElement>(null)

    return (
        <Transition
            mountOnEnter
            unmountOnExit
            in={inProp}
            key={key}
            nodeRef={nodeRef}
            timeout={150}
        >
            {state => (
                <article ref={nodeRef} key={key} className={`py-2 rounded-2xl w-full flex flex-col gap-3 relative box-border items-center transition-all ${className}`} style={transitionStyles[state]}>
                    <div className="text-xl bg-inverse-surface text-inverse-on-surface rounded-xl absolute -left-4 -top-4 p-2 z-10 font-black border border-outline-variant box-border">#{placement}</div>
                    <Link href={href} className="aspect-square w-full h-auto overflow-hidden relative rounded-3xl flex justify-center items-center border border-outline-variant box-border">
                        <Image
                            fill
                            src={icon}
                            alt={iconAlt}
                            className="z-1 scale-150 object-cover"
                        />
                    </Link>
                    <Link href={href} className="max-w-full"><h3 className="overflow-clip text-ellipsis text-on-surface text-center font-semibold text-2xl">{titleContent}</h3></Link>
                    <section className="flex text-on-surface gap-1 items-center justify-center text-xl">
                        <h3 className="w-fit font-semibold">{trailingTitleContent}</h3>
                        <span className="w-fit">{trailingSupporting}</span>
                    </section>
                </article>
            )}
        </Transition>
    )
}