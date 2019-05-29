import originalSlugify from "slug"

const slugifyCharmap = {
  ...originalSlugify.defaults.charmap,
  "'": " ",
  "@": " ",
  ".": " ",
}

export function slugify(string, replacement) {
  const options = {
    charmap: slugifyCharmap,
    mode: "rfc3986",
  }
  if (replacement) {
    options.replacement = replacement
  }
  return originalSlugify(string, options)
}
