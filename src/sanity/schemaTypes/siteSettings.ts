import { defineArrayMember, defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "heroLine",
      title: "Hero line (full sentence)",
      type: "string",
      description:
        'Used for page metadata and social previews, e.g. "I like building experiences." The visible hero is built from the prefix and phrases below.',
    }),
    defineField({
      name: "heroPrefix",
      title: "Hero prefix",
      type: "string",
      description: 'The words that stay put, e.g. "I like".',
    }),
    defineField({
      name: "heroPhrases",
      title: "Hero phrases",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      description:
        'The part after the prefix, cycled one at a time. Include the full stop, e.g. "working in UX and UI." Keep them a similar length — the line reserves the width of the longest.',
    }),
    defineField({ name: "scrollLabel", title: "Scroll cue label", type: "string" }),
    defineField({ name: "email", title: "Email", type: "string" }),
    defineField({ name: "location", title: "Location", type: "string" }),
    defineField({ name: "timezoneLabel", title: "Timezone label", type: "string" }),
    defineField({
      name: "timezoneOffsetMinutes",
      title: "Timezone offset (minutes)",
      type: "number",
      initialValue: 330,
    }),
    defineField({ name: "copyright", title: "Copyright", type: "string" }),
    defineField({
      name: "socials",
      title: "Social links",
      type: "array",
      of: [
        {
          type: "object",
          name: "socialLink",
          fields: [
            defineField({ name: "label", title: "Label", type: "string" }),
            defineField({ name: "url", title: "URL", type: "url" }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        },
      ],
    }),
    defineField({ name: "contactEyebrow", title: "Contact eyebrow", type: "string" }),
    defineField({ name: "featuredWorkLabel", title: "Featured work label", type: "string" }),
    defineField({ name: "archiveCtaLabel", title: "Archive CTA label", type: "string" }),
  ],
  preview: {
    prepare: () => ({ title: "Site Settings" }),
  },
});
