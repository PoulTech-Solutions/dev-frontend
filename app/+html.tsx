import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/** Web document shell — sets the browser tab favicon to the Poultech logo. */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Poultech Solutions</title>
        <link rel="icon" href="/favicon.ico" type="image/png" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
