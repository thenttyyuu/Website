/* image-loader.js
 * Small helper to insert responsive images without breaking layout.
 * Usage: ImageLoader.insert({container: elementOrSelector, baseName: 'myphoto', alt: 'desc', widths: [400,800,1200], formats: ['avif','webp','jpg'], sizes: '(max-width: 800px) 100vw, 800px'})
 */
const ImageLoader = (function(){
  function toPath(base, width, ext){
    return `assets/images/${base}-${width}.${ext}`;
  }

  function makeSource(format, baseName, widths, sizes){
    const srcset = widths.map(w => `${toPath(baseName, w, format)} ${w}w`).join(', ');
    const source = document.createElement('source');
    source.type = `image/${format}`;
    source.setAttribute('srcset', srcset);
    if(sizes) source.setAttribute('sizes', sizes);
    return source;
  }

  function makeImg(baseName, fallbackExt, widths, sizes, alt){
    const img = document.createElement('img');
    img.className = 'responsive-image';
    img.src = toPath(baseName, widths[Math.floor(widths.length/2)], fallbackExt);
    img.setAttribute('loading','lazy');
    img.setAttribute('decoding','async');
    if(alt) img.alt = alt;
    if(sizes) img.setAttribute('sizes', sizes);
    img.setAttribute('srcset', widths.map(w => `${toPath(baseName, w, fallbackExt)} ${w}w`).join(', '));
    return img;
  }

  function insert(opts){
    const container = (typeof opts.container === 'string') ? document.querySelector(opts.container) : opts.container;
    if(!container) return null;
    const baseName = opts.baseName;
    const widths = opts.widths || [400,800,1200];
    const formats = opts.formats || ['avif','webp','jpg'];
    const sizes = opts.sizes || '100vw';
    const alt = opts.alt || '';

    const picture = document.createElement('picture');
    // Add sources for each non-fallback format (in order)
    for(let i=0;i<formats.length-1;i++){
      picture.appendChild(makeSource(formats[i], baseName, widths, sizes));
    }
    picture.appendChild(makeImg(baseName, formats[formats.length-1], widths, sizes, alt));

    container.appendChild(picture);
    return picture;
  }

  return { insert };
})();

// Auto-expose for UMD-ish usage
if(typeof window !== 'undefined') window.ImageLoader = ImageLoader;
