# Post Image System (Pinterest + Blog)

Use `assets/data/posts.json` for each post image slot:

- `images.card` = listing/blog card image
- `images.hero` = full post hero image
- `images.pinterest` = vertical share image (recommended 1200x1800)

## Where to place files

- Standard/card/hero images: `assets/` or `assets/dental/`
- Pinterest vertical images: `assets/pinterest/`

## Add a new post

1. Add image files.
2. Add a new object under `posts` in `assets/data/posts.json`.
3. Use matching `slug` in HTML:
   - `body data-post-slug="your-post-slug"`
   - image tags can use `data-post-slug="your-post-slug" data-post-image="card|hero|pinterest"`

## Fallback

If `pinterest` is missing, the site falls back to the default image defined in `posts.json`.
