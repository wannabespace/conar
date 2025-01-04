// eslint-disable-next-line ts/no-explicit-any
export default function App({ Component, pageProps }: { Component: React.ComponentType, pageProps: any }) {
  return <Component {...pageProps} />
}
