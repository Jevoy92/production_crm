import { createServerFn } from "@tanstack/react-start";

export const fetchOgMeta = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => input)
  .handler(async ({ data }) => {
    const url = data.url;
    try {
      // YouTube → use oEmbed (cheap + reliable)
      const ytMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
      );
      if (ytMatch) {
        const videoId = ytMatch[1];
        const oembed = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        );
        if (oembed.ok) {
          const j = (await oembed.json()) as {
            title?: string;
            thumbnail_url?: string;
          };
          return {
            title: j.title ?? null,
            image:
              j.thumbnail_url ??
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          };
        }
        return {
          title: null,
          image: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        };
      }

      const res = await fetch(url, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; PalmerHouseOS/1.0; +https://palmerhouse.app)",
          accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
      if (!res.ok) return { title: null, image: null };
      const html = (await res.text()).slice(0, 200_000);
      const pick = (re: RegExp): string | null => {
        const m = html.match(re);
        return m?.[1]?.trim() ?? null;
      };
      const title =
        pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
        pick(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ??
        pick(/<title[^>]*>([^<]+)<\/title>/i);
      let image =
        pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
        pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
      if (image && image.startsWith("/")) {
        try {
          const u = new URL(url);
          image = `${u.origin}${image}`;
        } catch {
          /* ignore */
        }
      }
      return { title, image };
    } catch (err) {
      console.error("[fetchOgMeta] failed", err);
      return { title: null, image: null };
    }
  });