/** The store's red "A" mark, the same as the shop's logo and favicon. */
export default function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="12" fill="#181c23" />
      <path d="M32 10 52 54H42l-3.6-8.4H25.6L22 54H12Z" fill="#dd163b" />
      <path d="M32 27.5 28.3 37h7.4Z" fill="#181c23" />
    </svg>
  );
}
