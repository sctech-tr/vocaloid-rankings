import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/navbar'
import { Noto_Sans_JP, Inter } from 'next/font/google'
import localFont from "next/font/local"
import { Providers } from '@/components/providers'
import { Locale } from '@/localization/'
import Footer from '@/components/footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter' 
})
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-jp'
})
const materialSymbols = localFont({
  variable: '--font-family-symbols', // Variable name (to reference after in CSS/styles)
  style: 'normal',
  src: '../../../node_modules/material-symbols/material-symbols-rounded.woff2', // This is a reference to woff2 file from NPM package "material-symbols"
  display: 'block',
  weight: '100 700',
})

export const metadata: Metadata = {
  title: 'Vocaloid Rankings',
  description: 'A site that ranks vocaloid songs based on their view counts.',
}

export default function RootLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: {
    lang: Locale
  }
}) {
  const locale = params.lang
  return (
    <html lang={locale} className={`${inter.variable} ${notoSansJP.variable} ${materialSymbols.variable}`}>
      <body className='bg-background'>
        <Providers>
          <Navbar lang={locale} />
          <main className='max-w-screen-2xl min-h-screen m-auto flex flex-col justify-center items-start px-5 py-6'>
            {children}
          </main>
          <Footer lang={locale} />
        </Providers>
      </body>
    </html>
  )
}
