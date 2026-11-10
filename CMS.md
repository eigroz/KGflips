# KGflips editor

The editor is at /admin/login. It is absent from navigation, the sitemap and robots.txt; admin responses also send a noindex header. A private URL is not an access control: editing and uploads require a valid session.

The editor is organised by page and section. Edit text, link destinations, map links, dates and image descriptions; replace images with a JPG, PNG or WebP up to 1.5 MB. Use Publish changes to apply edits to all three pages together. Restore original returns a field to the Git version. Existing sections and photos can be edited; adding or rearranging sections is a source change. Event details repeated in the homepage, Event page and popup are separate fields. Page metadata and structured data remain in source control.

Production setup (Cloudflare Pages):
1. Create a D1 database for KGflips. Run cms/schema.sql against it, and bind it as CMS_DB in the existing Pages project's production settings. Use a separate database for any preview deployment.
2. Generate a strong random password in a password manager (at least 24 random characters). Set CMS_PASSWORD_HASH as an encrypted Pages secret containing the lowercase SHA-256 hex digest of the password. Do not commit the password or digest. Give the password to the editor separately.
3. Run npm run build:cms and deploy dist to the existing kgflips Pages project from the repository root. Do not deploy with the configuration in cms/wrangler.toml; that configuration is for local tests. Confirm the public pages and a sign-in before sharing the login URL.

For local development, build the files from the repository root, then from cms/ run wrangler d1 execute kgflips-cms-local --local --file schema.sql. Start wrangler pages dev ../dist --d1 CMS_DB=00000000-0000-4000-8000-000000000001 --ip 127.0.0.1 with a local CMS_PASSWORD_HASH binding. Never reuse the local test password in production.

D1 stores the published edits, uploaded images and expiring sessions. Keep the database when deploying a new version; take a backup before replacing or removing CMS field IDs. Preserve the comment and attribute IDs in the HTML when updating templates. If credentials are rotated, also delete the rows in cms_sessions to sign out existing sessions.

