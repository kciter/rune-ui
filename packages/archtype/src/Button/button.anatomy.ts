import { createAnatomy } from "@rune-ui/anatomy";

export const buttonAnatomy = createAnatomy("button").parts(
  "root",
  "label",
  "leftIcon",
  "rightIcon",
  "spinner",
  "spinnerText"
);

export const buttonParts = buttonAnatomy.build();
