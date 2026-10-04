/**
 * CVALMS PRO - UNIVERSAL SELF-STUDY MEDIA ENGINE
 * Parses, validates and renders multi-source media (YouTube, Shorts, Google Drive, LAN MP4, Images)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SelfStudyMedia = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function parseYouTubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const clean = url.trim();
    // Handles watch?v=, youtu.be/, embed/, shorts/, live/ with query parameters (?si=..., &t=...)
    const regExp = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:.*v(?:ersion)?\/|.*(?:[?&]v=)|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i;
    const match = clean.match(regExp);
    return match ? match[1] : null;
  }

  function parseGoogleDriveId(url) {
    if (!url || typeof url !== 'string') return null;
    const clean = url.trim();
    const match = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : null;
  }

  function isDirectVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const clean = url.trim().toLowerCase().split('?')[0];
    return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg') ||
           clean.endsWith('.m4v') || clean.endsWith('.mov') || clean.endsWith('.mkv') ||
           clean.startsWith('blob:') || clean.startsWith('data:video/');
  }

  function isImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const clean = url.trim().toLowerCase().split('?')[0];
    return clean.endsWith('.png') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') ||
           clean.endsWith('.gif') || clean.endsWith('.svg') || clean.endsWith('.webp') ||
           clean.includes('assets/img/');
  }

  function parseMediaSource(url) {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return { type: 'none', id: null, embedUrl: '', rawUrl: '' };
    }
    const clean = url.trim();

    // 1. YouTube
    const ytId = parseYouTubeId(clean);
    if (ytId) {
      return {
        type: 'youtube',
        id: ytId,
        embedUrl: `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`,
        rawUrl: clean
      };
    }

    // 2. Google Drive
    const gdId = parseGoogleDriveId(clean);
    if (gdId) {
      return {
        type: 'gdrive',
        id: gdId,
        embedUrl: `https://drive.google.com/file/d/${gdId}/preview`,
        rawUrl: clean
      };
    }

    // 3. Direct Video
    if (isDirectVideoUrl(clean)) {
      return {
        type: 'direct_video',
        id: null,
        embedUrl: clean,
        rawUrl: clean
      };
    }

    // 4. Image
    if (isImageUrl(clean)) {
      return {
        type: 'image',
        id: null,
        embedUrl: clean,
        rawUrl: clean
      };
    }

    // 5. Generic HTTP link that is NOT video/image
    return { type: 'invalid', id: null, embedUrl: '', rawUrl: clean };
  }

  function validateMediaUrl(url) {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return { ok: false, type: 'none', embedUrl: '', message: 'Chưa nhập đường dẫn video' };
    }

    const parsed = parseMediaSource(url);
    if (parsed.type === 'youtube') {
      return {
        ok: true,
        type: 'youtube',
        embedUrl: parsed.embedUrl,
        message: `Video YouTube hợp lệ (ID: ${parsed.id})`
      };
    }
    if (parsed.type === 'gdrive') {
      return {
        ok: true,
        type: 'gdrive',
        embedUrl: parsed.embedUrl,
        message: `Tệp video Google Drive hợp lệ (ID: ${parsed.id})`
      };
    }
    if (parsed.type === 'direct_video') {
      return {
        ok: true,
        type: 'direct_video',
        embedUrl: parsed.embedUrl,
        message: 'Đường dẫn tệp video trực tiếp (MP4/WebM/LAN)'
      };
    }
    if (parsed.type === 'image') {
      return {
        ok: true,
        type: 'image',
        embedUrl: parsed.embedUrl,
        message: 'Tệp hình ảnh hợp lệ'
      };
    }

    return {
      ok: false,
      type: 'invalid',
      embedUrl: '',
      message: 'Đường dẫn không hợp lệ. Vui lòng nhập link YouTube, Google Drive, hoặc file MP4'
    };
  }

  function renderMediaHtml(media) {
    if (!media || media.type === 'none' || !media.url) {
      return '';
    }

    const parsed = parseMediaSource(media.url);
    const caption = media.caption || 'Video bài giảng trực quan';

    if (parsed.type === 'youtube') {
      return `
        <div class="video-theater-wrapper">
          <div class="video-aspect-ratio">
            <iframe 
              src="${parsed.embedUrl}" 
              title="${caption}" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              referrerpolicy="strict-origin-when-cross-origin" 
              allowfullscreen>
            </iframe>
          </div>
          <div class="media-caption-bar">
            <div><i class="fa-solid fa-video" style="color: var(--accent-cyan); margin-right: 6px;"></i> ${caption}</div>
            <span class="hd-badge">YOUTUBE HD</span>
          </div>
        </div>
      `;
    }

    if (parsed.type === 'gdrive') {
      return `
        <div class="video-theater-wrapper">
          <div class="video-aspect-ratio">
            <iframe 
              src="${parsed.embedUrl}" 
              title="${caption}" 
              allow="autoplay; encrypted-media" 
              allowfullscreen>
            </iframe>
          </div>
          <div class="media-caption-bar">
            <div><i class="fa-solid fa-cloud" style="color: var(--accent-cyan); margin-right: 6px;"></i> ${caption}</div>
            <span class="hd-badge">GOOGLE DRIVE</span>
          </div>
        </div>
      `;
    }

    if (parsed.type === 'direct_video' || media.type === 'video') {
      return `
        <div class="video-theater-wrapper">
          <video src="${parsed.embedUrl || media.url}" controls controlsList="nodownload" preload="metadata" style="width: 100%; height: 100%; border: none; border-radius: var(--radius-lg);"></video>
          <div class="media-caption-bar">
            <div><i class="fa-solid fa-play-circle" style="color: var(--accent-cyan); margin-right: 6px;"></i> ${caption}</div>
            <span class="hd-badge">VIDEO NỘI BỘ</span>
          </div>
        </div>
      `;
    }

    if (parsed.type === 'image' || media.type === 'image') {
      return `
        <div style="margin-bottom: 20px; text-align: center;">
          <img src="${parsed.embedUrl || media.url}" alt="${caption}" style="max-width: 100%; border-radius: var(--radius-lg); border: 1px solid var(--border-card); box-shadow: var(--shadow-lg);">
          <div class="media-caption-bar" style="border-radius: 0 0 var(--radius-lg) var(--radius-lg); margin-top: -6px;">
            <div><i class="fa-solid fa-image" style="color: var(--accent-cyan); margin-right: 6px;"></i> ${caption}</div>
          </div>
        </div>
      `;
    }

    return '';
  }

  // Safe DOMPurify config helper
  function sanitizeMediaContent(html) {
    if (!html || typeof html !== 'string') return '';
    if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
      return DOMPurify.sanitize(html, {
        ADD_TAGS: ['iframe', 'video', 'source'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'referrerpolicy', 'controls', 'controlslist', 'preload']
      });
    }
    // Fallback safe stripping for Node / non-browser environments
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  }

  return {
    parseYouTubeId,
    parseGoogleDriveId,
    parseMediaSource,
    validateMediaUrl,
    renderMediaHtml,
    sanitizeMediaContent
  };
}));
