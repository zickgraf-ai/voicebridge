# TapToSpeak Marketing Website

Static marketing site for [taptospeak.app](https://taptospeak.app). Deployed via Cloudflare Pages.

## Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `index.html` | Landing page |
| `/privacy` | `privacy/index.html` | Privacy Policy (required for App Store) |
| `/terms` | `terms/index.html` | Terms of Use (required for App Store) |
| `/support` | `support/index.html` | Support & FAQ (required for App Store) |

## Updating Content

All content is in plain HTML files — edit directly and push. No build step required.

- **Shared styles**: `styles.css`
- **Icons**: `apple-touch-icon.png`, `favicon.ico`

## Deployment (Cloudflare Pages)

1. Connect this repo to Cloudflare Pages
2. Set the **build output directory** to `website/` (or deploy the `website/` folder directly)
3. No build command needed — these are static files
4. Custom domain: `taptospeak.app`

## Subdomain Migration

Before deploying this site to the root domain:

1. Move the existing web app to `app.taptospeak.app` (CNAME record in Cloudflare DNS)
2. Verify the web app works at the new subdomain
3. Then deploy this marketing site to the root domain

## App Store Download Link

The "Download on the App Store" button currently links to `#`. Replace with the real App Store URL once the app is live.
