import { defineField, defineType } from "sanity";

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
  ],
  preview: {
    select: { title: "heading", subtitle: "kicker", media: "imageA" },
  },
});
