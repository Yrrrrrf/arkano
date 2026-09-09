// portal.ts — Hub dashboard and GitHub Pages SPA router fallback generator for Arkane
export interface HubOptions {
	readonly repoName: string;
	readonly commitSha?: string;
	readonly timestamp?: string;
}

export function generateHubHtml(options: HubOptions): string {
	const {
		repoName,
		commitSha = "latest",
		timestamp = new Date().toISOString(),
	} = options;

	return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Arkane · Universal Svelte 5 Runes Conduit</title>
  <meta name="description" content="Portal central for Arkane: Universal Svelte 5 Runes Conduit for React 19 and Vue 3.5." />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
  <style>
    :root {
      --bg: #070a12;
      --card-bg: #0f172a;
      --card-hover: #162036;
      --border: #1e293b;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #f43f5e;
      --accent-glow: rgba(244, 63, 94, 0.2);
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.5;
      position: relative;
      overflow-x: hidden;
    }
    .ambient-glow {
      position: absolute;
      top: -120px;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 400px;
      background: radial-gradient(circle, rgba(244, 63, 94, 0.15) 0%, rgba(139, 92, 246, 0.08) 40%, transparent 70%);
      filter: blur(60px);
      pointer-events: none;
      z-index: 0;
    }
    .container {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 3rem 1.5rem;
      z-index: 1;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    header {
      text-align: center;
      margin-bottom: 3.5rem;
    }
    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.875rem;
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.3);
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #fb7185;
      margin-bottom: 1.25rem;
      letter-spacing: 0.025em;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: #f43f5e;
      border-radius: 50%;
      box-shadow: 0 0 10px #f43f5e;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    h1 {
      font-size: clamp(2.5rem, 5vw, 3.75rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.75rem;
    }
    .subtitle {
      font-size: 1.125rem;
      color: var(--muted);
      max-width: 720px;
      margin: 0 auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.75rem;
      margin-bottom: 4rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
    }
    .card:hover {
      transform: translateY(-4px);
      background: var(--card-hover);
      border-color: rgba(244, 63, 94, 0.4);
      box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.5), 0 0 25px -5px var(--accent-glow);
    }
    .card-badge {
      display: inline-flex;
      align-self: flex-start;
      padding: 0.25rem 0.625rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1.25rem;
    }
    .badge-react { background: rgba(97, 218, 251, 0.15); color: #61dafb; border: 1px solid rgba(97, 218, 251, 0.3); }
    .badge-vue { background: rgba(66, 184, 131, 0.15); color: #42b883; border: 1px solid rgba(66, 184, 131, 0.3); }
    .badge-svelte { background: rgba(255, 62, 0, 0.15); color: #ff3e00; border: 1px solid rgba(255, 62, 0, 0.3); }
    .card-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .card-desc {
      color: var(--muted);
      font-size: 0.9375rem;
      line-height: 1.55;
      margin-bottom: 1.5rem;
      flex-grow: 1;
    }
    .feature-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 2rem;
      font-size: 0.875rem;
      color: #cbd5e1;
    }
    .feature-list li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .feature-list li span {
      color: #38bdf8;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 0.75rem;
      font-weight: 600;
      font-size: 0.9375rem;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-react {
      background: #0284c7;
      color: #f0f9ff;
    }
    .btn-react:hover {
      background: #38bdf8;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
    }
    .btn-vue {
      background: #059669;
      color: #ecfdf5;
    }
    .btn-vue:hover {
      background: #10b981;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
    }
    .btn-svelte {
      background: #ea580c;
      color: #fff7ed;
    }
    .btn-svelte:hover {
      background: #f97316;
      box-shadow: 0 0 20px rgba(249, 115, 22, 0.4);
    }
    footer {
      margin-top: auto;
      padding-top: 2.5rem;
      border-top: 1px solid var(--border);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.875rem;
      color: var(--muted);
    }
    footer a {
      color: #38bdf8;
      text-decoration: none;
      transition: color 0.15s;
    }
    footer a:hover {
      color: #7dd3fc;
      text-decoration: underline;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.8125rem;
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>
  <div class="container">
    <header>
      <div class="brand-badge">
        <div class="pulse-dot"></div>
        <span>3 SHOWCASE APPS LIVE</span>
      </div>
      <h1>ARKANE PLATFORM</h1>
      <p class="subtitle">Universal Svelte 5 Runes Conduit for React 19 &amp; Vue 3.5 with zero runtime overhead and sub-millisecond HMR.</p>
    </header>

    <main class="grid">
      <!-- App 1: React 19 Showcase -->
      <article class="card">
        <span class="card-badge badge-react">React 19 Host</span>
        <h2 class="card-title">⚛️ React 19 Showcase</h2>
        <p class="card-desc">Direct transparent Svelte 5 Runes component imports into React 19 with bi-directional reactive binding conduit and isolated HMR boundaries.</p>
        <ul class="feature-list">
          <li><span>✓</span> Direct transparent .svelte imports without wrappers</li>
          <li><span>✓</span> Bidirectional state binding via on&lt;Prop&gt;Change proxies</li>
          <li><span>✓</span> React 19 ref-as-prop and Action state compatibility</li>
          <li><span>✓</span> Vite 8 Environment API hotUpdate isolation</li>
        </ul>
        <a href="./react/" class="btn btn-react">Launch React App →</a>
      </article>

      <!-- App 2: Vue 3.5 Showcase -->
      <article class="card">
        <span class="card-badge badge-vue">Vue 3.5 Host</span>
        <h2 class="card-title">💚 Vue 3.5 Showcase</h2>
        <p class="card-desc">Deep attribute reactivity, v-model synchronization, and native Svelte 5 Runes embedding in Vue 3.5 with zero wrapper boilerplate.</p>
        <ul class="feature-list">
          <li><span>✓</span> Native v-model and onUpdate:&lt;prop&gt; synchronization</li>
          <li><span>✓</span> Deep attribute reactivity &amp; slot snippet projection</li>
          <li><span>✓</span> Reactive conduit with zero boilerplate overhead</li>
          <li><span>✓</span> Vite 8 Environment API hotUpdate isolation</li>
        </ul>
        <a href="./vue/" class="btn btn-vue">Launch Vue App →</a>
      </article>

      <!-- App 3: Svelte 5 Native -->
      <article class="card">
        <span class="card-badge badge-svelte">SvelteKit 5 Native</span>
        <h2 class="card-title">🔥 Svelte 5 Native</h2>
        <p class="card-desc">Pure SvelteKit 5 Runes reference architecture showcasing native performance, $state, $derived, and universal component integration.</p>
        <ul class="feature-list">
          <li><span>✓</span> Pure SvelteKit 5 Runes reference architecture</li>
          <li><span>✓</span> $state, $derived, and $bindable first-class runes</li>
          <li><span>✓</span> High-performance static adapter prerendering</li>
          <li><span>✓</span> Universal component fixture benchmark</li>
        </ul>
        <a href="./svelte/" class="btn btn-svelte">Launch Svelte App →</a>
      </article>
    </main>

    <footer>
      <div>
        <span>Monorepo: </span>
        <a href="https://github.com/Yrrrrrf/${repoName}" target="_blank" rel="noopener">github.com/Yrrrrrf/${repoName}</a>
        <span style="margin: 0 0.5rem">·</span>
        <span>Technology: Svelte 5 (Runes) · React 19 · Vue 3.5 · Vite 8 · Deno 2</span>
      </div>
      <div class="mono">
        Commit: ${commitSha.slice(0, 7)} · Deployed: ${timestamp.slice(0, 10)}
      </div>
    </footer>
  </div>
</body>
</html>
`;
}

export function generate404Html(repoName: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Arkane · Redirecting...</title>
  <script>
    // GitHub Pages SPA router redirect handler
    (function() {
      var l = window.location;
      var path = l.pathname.replace(/^\\/+/, '').split('/');
      var repo = '${repoName}';
      var app = path[1]; // e.g. react, vue, svelte
      
      if (['react', 'vue', 'svelte'].indexOf(app) !== -1) {
        var sub = path.slice(2).join('/');
        l.replace(l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') + '/' + repo + '/' + app + '/' + (sub ? '#' + sub : '') + l.search + l.hash);
      } else {
        l.replace(l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') + '/' + repo + '/');
      }
    })();
  </script>
</head>
<body style="background:#070a12;color:#94a3b8;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Redirecting to Arkane Platform...</p>
</body>
</html>
`;
}
