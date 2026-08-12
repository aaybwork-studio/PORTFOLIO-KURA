import { defineField, defineType } from "sanity";

export const archiveItem = defineType({
  name: "archiveItem",
  title: "Archive item",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "image", title: "Image", type: "image", options: { hotspot: true } }),
    defineField({ name: "order", title: "Order", type: "number" }),
  ],
  preview: {
    select: { title: "title", subtitle: "order", media: "image" },
    prepare: ({ title, subtitle, media }) => ({
      title: title ?? "Untitled",
      subtitle: typeof subtitle === "number" ? `#${subtitle}` : undefined,
      media,
    }),
  },
});
