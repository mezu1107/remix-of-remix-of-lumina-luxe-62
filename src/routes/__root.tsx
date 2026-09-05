import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { PromoPopup } from "@/components/PromoPopup";
import { AiAssistant } from "@/components/AiAssistant";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { TrackingPixels } from "@/components/TrackingPixels";
import { AutoTracker } from "@/components/AutoTracker";
import { ScrollProgress } from "@/components/ScrollProgress";
import { BackToTop } from "@/components/BackToTop";
import { LiveSalesToast } from "@/components/social-proof/LiveSalesToast";
import { ExitIntentOffer } from "@/components/conversion/ExitIntentOffer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  const router = useRouter();

  // Never leave a visitor on a dead end: any unknown or outdated URL quietly
  // returns to the home page instead of showing a 404 screen.
  useEffect(() => {
    router.navigate({ to: "/", replace: true });
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h2 className="font-serif text-2xl">Taking you home…</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          That page has moved. Redirecting you to the Timera home page.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium uppercase tracking-widest text-primary-foreground transition hover:bg-primary/90"
        >
          Return home
        </a>
      </div>
    </div>
  );
}


function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or return home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="h-10 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="h-10 rounded-md border border-border px-6 text-sm font-medium inline-flex items-center">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Timera — Premium Watches Pakistan | Cash on Delivery" },
      { name: "description", content: "Shop Timera premium watches online. Cash on Delivery across Pakistan. 1-year warranty on every timepiece. Strap, chain, automatic, quartz and Arabic dial watches." },
      { name: "keywords", content: "Timera, watches Pakistan, buy watches online Pakistan, cash on delivery watches, strap watch, chain watch, arabic dial watch, automatic watch, quartz watch" },
      { name: "author", content: "Timera" },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Timera — Premium Watches Pakistan | Cash on Delivery" },
      { property: "og:description", content: "Shop Timera premium watches online. Cash on Delivery across Pakistan. 1-year warranty on every timepiece." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Timera" },
      { property: "og:locale", content: "en_PK" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@timera" },
      { name: "theme-color", content: "#F7F5F0" },
      { name: "twitter:title", content: "Timera — Premium Watches Pakistan | Cash on Delivery" },
      { name: "twitter:description", content: "Shop Timera premium watches online. Cash on Delivery across Pakistan. 1-year warranty on every timepiece." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/36ae3d18-a66d-4d2c-8e58-ed76dda341c9" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/36ae3d18-a66d-4d2c-8e58-ed76dda341c9" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://connect.facebook.net" },
      { rel: "dns-prefetch", href: "https://connect.facebook.net" },
      { rel: "dns-prefetch", href: "https://www.googletagmanager.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Timera",
          url: "https://timera.store/",
          description: "Premium watches with Cash on Delivery across Pakistan. 1-year warranty on every timepiece.",
          sameAs: ["https://instagram.com/timera", "https://facebook.com/timera"],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <ScrollProgress />
        <AnnouncementBar />
        <Header />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CartDrawer />
        <PromoPopup />
        <TrackingPixels />
        <AutoTracker />
        <AiAssistant />
        <FloatingWhatsApp />
        <BackToTop />
        <LiveSalesToast />
        <ExitIntentOffer />
        <Toaster position="bottom-right" theme="light" />
      </div>
    </QueryClientProvider>
  );
}
