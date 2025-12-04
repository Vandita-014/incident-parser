import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="description" content="Intelligent Incident Parser - Convert unstructured incident reports to structured JSON using AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="bg-[#0a0a0a] text-white antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
