import './globals.css'
import Script from 'next/script'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full w-full gradient-bg">
        {children}
        <Script
          id="squircle-worklet"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('paintWorklet' in CSS) {
                CSS.paintWorklet.addModule('/squircle.js');
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
