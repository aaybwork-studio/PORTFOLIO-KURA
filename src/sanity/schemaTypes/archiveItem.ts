import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * One plate in the archive carousel.
 *
 * `kind` decides whether the plate opens. Posters and UI work get their own
 * page — mockups, crops, the details you cannot read at carousel size. Photos
 * stay in the carousel, because a photograph is already the whole artefact and
 * a detail page for it would just be the same image again, larger.
 */
export const archiveItem = defineType({
  name: "archiveItem",
  title: "Archive item",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      description: "Only needed for items that open — posters and UI work.",
    }),
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      options: {
        list: [
          { title: "Poster", value: "poster" },
          { title: "UI work", value: "ui" },
          { title: "Photography", value: "photo" },
        ],
        layout: "radio",
      },
      initialValue: "poster",
    }),
    defineField({ name: "year", title: "Year", type: "string" }),
    defineField({
      name: "note",
      title: "Note",
      type: "text",
      rows: 3,
      description: "A line or two of context on the detail page. Optional.",
    }),
    defineField({ name: "image", title: "Card image", type: "image", options: { hotspot: true } }),
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      description: "Mockups, crops and detail shots shown on the item's own page.",
      of: [defineArrayMember({ type: "caseMedia" })],
    }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
  preview: {
    select: { title: "title", kind: "kind", order: "order", media: "image" },
    prepare: ({ title, kind, order, media }) => ({
      title: title ?? "Untitled",
      subtitle: [kind, typeof order === "number" ? `#${order}` : null].filter(Boolean).join(" · "),
      media,
    }),
  },
});
