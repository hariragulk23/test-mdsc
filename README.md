# Madrid Specialty Coffee: website

Static website (HTML + CSS + JavaScript). No build step, no installs.

## 1. See it live in 1 minute (optional test)
1. Unzip `madrid-specialty-coffee.zip`
2. Open https://app.netlify.com/drop
3. Drag the unzipped folder onto the page
4. Netlify gives you a live link

## 2. Upload to GitHub
1. github.com → **+** (top right) → **New repository**
2. Name: `madrid-specialty-coffee` → **Create repository**
3. Click **uploading an existing file**
4. Drag ALL files and folders from the unzipped folder (including `assets`)
5. Click **Commit changes**

## 3. Deploy on Netlify from GitHub
1. app.netlify.com → **Add new site** → **Import an existing project**
2. Choose **GitHub** → pick `madrid-specialty-coffee`
3. Build command: leave **empty**. Publish directory: `.`
4. Click **Deploy**
5. Forms: **Site configuration → Forms → Enable form detection**, then **Deploys → Trigger deploy**
6. Form messages arrive in **Netlify → Forms** (you can add email notifications there)

## 4. Placeholders to fill in
| Placeholder | Where | Example |
|---|---|---|
| `[TU-NUMERO]` | WhatsApp links (all pages) | `34600111222` (no + or spaces) |
| `[TU NÚMERO]` | Visible phone text | `+34 600 111 222` |
| `[TU-EMAIL]` / `[TU EMAIL]` | Footer, contact, legal | `hola@tudominio.com` |
| `[TU HORARIO]` | contacto.html | `L–V, 9:00–18:00` |
| `[RAZÓN SOCIAL]`, `[NIF]`, `[DIRECCIÓN]`, `[REGISTRO MERCANTIL]` | Legal pages | Company data |
| `TU-DOMINIO` | `sitemap.xml`, `robots.txt` | `madridspecialtycoffee.com` |

## 5. Images and video
Generated with Higgsfield and loaded from Higgsfield's CDN:

| Used for | File |
|---|---|
| Hero video | hf_20261017_185028_c91ee1d2-...mp4 |
| Green coffee | hf_20261017_185046_3201e842-...png |
| Roaster | hf_20261017_185047_9cb431f7-...png |
| Cupping | hf_20261017_185047_adc1e3fe-...png |
| Brewing tools | hf_20261017_185048_b9b10a59-...png |
| Café interior | hf_20261017_185048_eb25df5a-...png |
| Event bar | hf_20261017_185046_cd1b7a9c-...png |
| Roasted beans | hf_20261017_185047_a153ee10-...png |
| Brand bags | hf_20261017_185047_f99f86f4-...png |

Recommended later: download them into `assets/img` and `assets/video`, convert images to WebP (much lighter), and update the links.

## Files
- `index.html` and the other `.html` files: one per page
- `assets/css/style.css`: colours, fonts, layout
- `assets/js/main.js`: animations, roast simulator, brew calculator
- `netlify.toml`: Netlify settings
