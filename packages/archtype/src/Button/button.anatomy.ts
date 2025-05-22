import { createAnatomy } from "@rune-ui/anatomy";

export const buttonAnatomy = createAnatomy("button").parts(
  "root",
  "inner",
  "label",
  "leftIcon",
  "rightIcon"
);

export const buttonParts = buttonAnatomy.build();
