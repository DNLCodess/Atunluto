export default function manifest() {
  return {
    name: "Atunluto",
    short_name: "AtunlutoPWA",
    description: "Atunluto Official Website",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
