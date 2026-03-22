/**
 * Custom root HTML para FLOWYA web.
 * Solo afecta builds web; builds nativas no usan este archivo.
 *
 * Viewport: evita zoom accidental por doble tap / pinch en mobile.
 * Scroll: body overflow-y auto permite scroll en Spot Detail y Create Spot.
 * El reset por defecto (overflow:hidden) impedía scroll en pantallas con contenido largo.
 */
import { ScrollViewStyleReset } from 'expo-router/html';

/** Alineado con theme (background light / dark) para evitar flash del canvas antes de React. */
const FLOWYA_HTML_BG_LIGHT = '#fbfbfd';
const FLOWYA_HTML_BG_DARK = '#000000';

export default function RootHtml({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        {/* Script síncrono: prefers-color-scheme en html antes del primer paint (evita flash light). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=window.matchMedia('(prefers-color-scheme: dark)');if(m.matches){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light'}}catch(e){}})();`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `/* FLOWYA: permitir scroll en pantallas con contenido largo (Spot Detail, Create Spot) */
html,body{min-height:100%}#root{min-height:100%;height:auto;display:flex;flex:1}body{overflow-y:auto;overflow-x:hidden}
html{background-color:${FLOWYA_HTML_BG_LIGHT}}
html.dark{background-color:${FLOWYA_HTML_BG_DARK}}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
