import { createAnatomy } from "@rune-ui/anatomy";

export const aspectRatioAnatomy = createAnatomy("aspect-ratio").parts(
  "root",
  "padding",
  "content"
);

export const aspectRatioParts = aspectRatioAnatomy.build();
