Images folder — usage

Place image files here (jpg, png, webp, avif) for the site. Guidelines:

- Add responsive variants named like: myphoto-400.jpg, myphoto-800.jpg, myphoto-1600.jpg.
- Use lowercase, hyphen-separated filenames, no spaces.
- Prefer modern formats (webp, avif) with fallbacks (jpg).
- Reference images in HTML using the provided image-loader helper or the .responsive-image CSS class.

Examples:

HTML (manual srcset):
<picture>
  <source type="image/webp" srcset="assets/images/myphoto-800.webp 800w, assets/images/myphoto-1600.webp 1600w" sizes="(max-width: 800px) 100vw, 800px">
  <img class="responsive-image" src="assets/images/myphoto-800.jpg" alt="Description">
</picture>

JS helper (image-loader.js) automates creating <picture> with srcset and sizes.
