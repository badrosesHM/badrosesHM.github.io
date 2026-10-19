# Bad Roses website

A static fan website designed for GitHub Pages. It uses plain HTML, CSS, JavaScript, and a local JSON copy of the supplied HM 2018 database. No build step or package installation is needed.

## Add the social links

Open `site-config.js` and paste the two public URLs between the quotes:

```js
window.BAD_ROSES_LINKS={
  communityDiscord:'https://discord.gg/your-community-invite',
  tiktok:'https://www.tiktok.com/@your-profile'
};
```

Replace each example with your real invite or profile URL before publishing. The waitlist button uses the community Discord invite.

## Publish with GitHub Pages

Commit the contents of this folder to the repository’s publishing branch, then choose the repository root as the GitHub Pages source in the repository’s Pages settings. This site uses relative paths and works from a project subfolder URL.

## Included content

- `data/database.json` contains the extracted 2018 entries plus the imported Beauty collection with makeup and hairstyles.
- Makeup and hairstyle records and images are sourced from [Starstable Database](https://ssodb.bplaced.net/db/en/) by Abbie Starwatcher; pictures originate from Star Stable Online.
- Database item thumbnails load from image URLs present in the workbook; image links are loaded on demand as visitors browse.
- `data/star_locations.txt` contains the editable star coordinates and clues used by the interactive map.
- `assets/jorvik-map.png` and `assets/star-marker.png` are the supplied map and marker artwork.
- `map.js` controls star parsing, search, filtering, wheel zoom, drag movement, and marker selection.
- `map.css` controls the map page layout and appearance.
- `reputation.css` controls the historical Kallters and Epona reputation guide.
- `assets/kallters-reputation.png` and `assets/epona-reputation.png` are the supplied guide images.
- `assets/rose-banner.png` is generated artwork featuring real red roses.
- Discord and TikTok marks use the [Simple Icons](https://github.com/simple-icons/simple-icons) brand shapes. Their marks and names remain trademarks of their owners.

## Privacy and fan-site notice

The site does not collect submissions, create accounts, use analytics, set tracking cookies, or embed third-party social widgets. A cookie-consent pop-up is not included for the current static feature set. The hosting provider and external image hosts receive the ordinary network request information needed to serve pages and images. The Privacy section explains external links and image requests. If analytics, forms, embedded content, or additional tracking are added later, revisit the privacy and consent notices first.

Bad Roses is an unofficial, non-commercial Star Stable fan community and is not affiliated with Star Stable Entertainment AB. The database is a historical 2018 snapshot and may include errors or outdated item availability. Star Stable’s current game-service license restricts commercial use of game content; review the official license before adding monetization.
