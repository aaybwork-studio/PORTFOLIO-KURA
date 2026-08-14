import { defineArrayMember, defineField, defineType } from "sanity";

export const caseSection = defineType({
  name: "caseSection",
  title: "Case section",
  type: "object",
  fields: [
    defineField({ name: "kicker", title: "Kicker", type: "string" }),
    defineField({ name: "heading", title: "Heading", type: "string" }),
    defineField({ name: "body", title: "Body", type: "text", rows: 4 }),
    defineField({ name: "note", title: "Note", type: "text", rows: 3 }),
    defineField({ name: "imageA", title: "Image A", type: "image", options: { hotspot: true } }),
    defineField({ name: "imageB", title: "Image B", type: "image", options: { hotspot: true } }),
    /*
     * Media replaces Image A / B when it has anything in it.
     *
     * A and B were two fixed slots, which fixed the layout too: every section
     * was one text column beside exactly two stacked images. This is a list, so
     * a section can be one full-bleed frame, a split pair, or six shots — and it
     * takes video. A and B stay so existing projects keep rendering.
     */
    defineField({
      name: "media",
      title: "Media",
      type: "array",
      description:
        "Images and video for this section. Leave empty to keep using Image A and Image B.",
      of: [defineArrayMember({ type: "caseMedia" })],
    }),
  ],
  preview: {
    select: { title: "heading", subtitle: "kicker", media: "imageA" },
  },
});
