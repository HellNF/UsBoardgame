import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { publicEnv } from "@/lib/env";

/**
 * Proxy di Next.js 16 (una volta si chiamava middleware, F0-04): rinnova il cookie della
 * sessione anonima a ogni richiesta e fa un controllo **ottimistico** sulle pagine della
 * stanza. Non è qui l'autorizzazione vera: quella la fanno RLS e le route API.
 *
 * Senza `.env.local` (build di produzione, pagine di sviluppo) il proxy lascia passare tutto:
 * `pnpm build` deve funzionare anche senza database.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  let url: string;
  let publishableKey: string;
  try {
    const env = publicEnv();
    url = env.NEXT_PUBLIC_SUPABASE_URL;
    publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  } catch {
    return response;
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Rinnova il token se serve; `getUser` valida la sessione lato Supabase.
  const { data } = await supabase.auth.getUser();

  const roomMatch = /^\/r\/([A-Za-z0-9]+)/.exec(request.nextUrl.pathname);
  if (roomMatch && !data.user) {
    const target = request.nextUrl.clone();
    target.pathname = "/";
    target.search = "";
    target.searchParams.set("code", roomMatch[1].toUpperCase());
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = {
  matcher: [
    // Tutto tranne i file statici di Next e le immagini/asset: il proxy non serve per quelli.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|riv|mp4|webm|woff|woff2)$).*)",
  ],
};
