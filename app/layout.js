export const metadata = {
  title: 'INTOPIA HUB',
  description: 'The central marketplace for the Intopia economy',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0B132B' }}>
        {children}
      </body>
    </html>
  )
}
