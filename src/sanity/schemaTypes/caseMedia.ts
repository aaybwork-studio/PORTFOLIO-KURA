import { defineField, defineType } from "sanity";

/**
 * One media block in a case section.
 *
 * Span is the layout decision and it is the only one: `full` takes the whole
 * measure, `half` pairs with the next `half` to make a split row. Two `half`
 * blocks in a row sit side by side on desktop and stack on phones.
 *
 * Either upload an image or paste a video URL. A video wins if both are set.
 */
export const caseMedia = defineType({
  name: "caseMedia",
  title: "Media",
  type: "object",
  fields: [
    defineField({
      name: "span",
      title: "Width",
      type: "string",
      options: {
        list: [
          { title: "Full width", value: "full" },
          { title: "Half (pairs with the next half)", value: "half" },
        ],
        layout: "radio",
      },
      initialValue: "full",
    }),
    defineField({ name: "image", title: "Image", type: "image", options: { hotspot: true } }),
    defineField({
      name: "videoUrl",
      title: "Video URL",
      type: "url",
      description:
        "Direct file URL ending in .mp4 or .webm. It autoplays muted and loops, so keep it short and silent.",
    }),
    defineField({
      name: "poster",
      title: "Video poster",
      type: "image",
      description: "First frame, shown while the video loads. Ignored for images.",
      options: { hotspot: true },
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      description: "Describe what the shot shows. Leave empty if it is purely decorative.",
    }),
  ],
  preview: {
    select: { title: "alt", subtitle: "span", media: "image" },
    prepare: ({ title, subtitle, media }) => ({
      title: title || "Media",
      subtitle: subtitle === "half" ? "Half width" : "Full width",
      media,
    }),
  },
});
