/**
 * @author: Udit Kumar
 * ChartForge - Kroki Diagram Viewer
 * Usage: new ChartForge({ diagram, type, format, container })
 */
class ChartForge {
  static icons = {
    zoomIn: '<circle cx="11" cy="11" r="8"/><path d="M11 8v6M8 11h6"/>',
    zoomOut: '<circle cx="11" cy="11" r="8"/><path d="M8 11h6"/>',
    reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5"/>',
    theme: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    check: '<path d="M20 6L9 17l-5-5"/>'
  };

  constructor({ diagram, type = 'mermaid', format = 'svg', container = document.body }) {
    this.diagram = diagram;
    this.type = type;
    this.format = format;
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.panzoom = null;
    this.url = this.#buildUrl();
    this.#init();
  }

  #encode(s) {
    const data = pako.deflate(new TextEncoder().encode(s.trim()));
    return btoa(String.fromCharCode(...data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  #buildUrl() {
    return `https://kroki.io/${this.type}/${this.format}/${this.#encode(this.diagram)}`;
  }

  #svg(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ChartForge.icons[name]}</svg>`;
  }

  #btn(icon, title, fn) {
    const b = document.createElement('button');
    b.innerHTML = this.#svg(icon);
    b.title = title;
    b.onclick = fn;
    return b;
  }

  #updateZoom() {
    if (this.panzoom) this.zoomLabel.textContent = Math.round(this.panzoom.getScale() * 100) + '%';
  }

  #init() {
    // Toolbar
    this.toolbar = document.createElement('div');
    this.toolbar.id = 'bar';

    this.zoomLabel = document.createElement('span');
    this.zoomLabel.id = 'z';
    this.zoomLabel.textContent = '100%';

    this.copyBtn = this.#btn('copy', 'Copy URL', () => { this.copy(); });

    this.toolbar.append(
      this.#btn('zoomIn', 'Zoom In', () => { this.zoomIn(); }),
      this.#btn('zoomOut', 'Zoom Out', () => { this.zoomOut(); }),
      this.#btn('reset', 'Reset', () => { this.reset(); }),
      this.zoomLabel,
      this.#btn('theme', 'Toggle Theme', () => { this.toggleTheme(); }),
      this.copyBtn
    );

    // Canvas container
    this.canvas = document.createElement('div');
    this.canvas.id = 'c';

    // Image
    this.img = document.createElement('img');
    this.img.id = 'd';
    this.img.crossOrigin = 'anonymous';
    this.img.onload = () => this.#onImageLoad();
    this.img.src = this.url;

    this.canvas.appendChild(this.img);

    // Hint
    this.hint = document.createElement('div');
    this.hint.id = 'h';
    this.hint.textContent = 'Scroll zoom • Drag pan • Dblclick reset';

    // Append to container
    this.container.append(this.toolbar, this.canvas, this.hint);

    // Events
    this.canvas.ondblclick = () => this.reset();

    // Auto dark mode
    if (matchMedia('(prefers-color-scheme:dark)').matches) {
      document.documentElement.dataset.theme = 'dark';
    }
  }

  #onImageLoad() {
    const startX = (this.canvas.clientWidth - this.img.width) / 2;
    const startY = (this.canvas.clientHeight - this.img.height) / 2;
    this.panzoom = Panzoom(this.img, { maxScale: 10, minScale: 0.1, startX, startY });
    this.canvas.addEventListener('wheel', this.panzoom.zoomWithWheel);
    this.img.addEventListener('panzoomchange', () => this.#updateZoom());
    this.#updateZoom();
  }

  // Public API
  zoomIn() { this.panzoom?.zoomIn(); this.#updateZoom(); }
  zoomOut() { this.panzoom?.zoomOut(); this.#updateZoom(); }
  reset() { this.panzoom?.reset(); this.#updateZoom(); }
  
  toggleTheme() {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme ? '' : 'dark';
  }

  async copy() {
    try {
      await navigator.clipboard.writeText(this.url);
      this.#showCopyFeedback(true);
    } catch (err) {
      console.error('Copy failed:', err);
      this.#showCopyFeedback(false);
    }
  }

  #showCopyFeedback(success) {
    const originalIcon = this.copyBtn.innerHTML;
    this.copyBtn.innerHTML = this.#svg('check');
    this.copyBtn.style.background = success ? '#22c55e' : '#ef4444';
    this.copyBtn.style.borderColor = success ? '#22c55e' : '#ef4444';
    this.copyBtn.style.color = '#fff';

    setTimeout(() => {
      this.copyBtn.innerHTML = originalIcon;
      this.copyBtn.style.background = '';
      this.copyBtn.style.borderColor = '';
      this.copyBtn.style.color = '';
    }, 1500);
  }

  getUrl() { return this.url; }
  destroy() { this.panzoom?.destroy(); this.container.innerHTML = ''; }
}
