const PORTRAITS = [
  { key: "orange", src: "/logo.png?v=20261110" },
  { key: "lemon", src: "/portrait-lemon.png" },
  { key: "apple", src: "/portrait-apple.png" },
  { key: "grape", src: "/portrait-grape.png" },
];

/** LINE 名片的四組主題頭像，與首頁輪播同步。 */
export function ThemeContactPortrait({ scene }: { scene: string }) {
  const active = scene === "lemon" || scene === "apple" || scene === "grape" ? scene : "orange";
  return (
    <span className="theme-contact-portrait">
      {PORTRAITS.map(({ key, src }) => (
        <img key={key} src={src} alt={key === active ? "LINUS 住好日" : ""}
          aria-hidden={key !== active} className={key === active ? "is-active" : ""} />
      ))}
    </span>
  );
}
