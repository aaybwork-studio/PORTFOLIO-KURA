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
    defineField({
      name: "ratio",
      title: "Shape",
      type: "string",
      description:
        "Leave on Default and the width decides: full blocks are 16:10, halves are 4:3, and the asset is cropped to fit. Set one of the others when the asset's own shape has to survive.",
      options: {
        list: [
          { title: "Default (from width)", value: "" },
          { title: "Square 1:1", value: "1:1" },
          { title: "4:3", value: "4:3" },
          { title: "3:2", value: "3:2" },
          { title: "16:10", value: "16:10" },
          { title: "16:9", value: "16:9" },
          { title: "Panorama 21:9", value: "21:9" },
          { title: "Strip 16:3", value: "16:3" },
        ],
      },
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
