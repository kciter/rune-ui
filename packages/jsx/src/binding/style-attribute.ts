import { type RuneCSSProperties } from "@rune-ui/types/dist";

const UnitlessNumber = new Set([
  "animationIterationCount",
  "aspectRatio",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "columns",
  "fillOpacity",
  "flex",
  "flexGrow",
  "flexNegative",
  "flexOrder",
  "flexPositive",
  "flexShrink",
  "floodOpacity",
  "fontWeight",
  "gridArea",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnSpan",
  "gridColumnStart",
  "gridRow",
  "gridRowEnd",
  "gridRowSpan",
  "gridRowStart",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "scale",
  "stopOpacity",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",

  "MozAnimationIterationCount",

  "WebkitAnimationIterationCount",
  "WebkitColumnCount",
  "WebkitColumns",
  "WebkitFlex",
  "WebkitFlexGrow",
  "WebkitFlexPositive",
  "WebkitFlexShrink",
  "WebkitLineClamp",

  "msAnimationIterationCount",
  "msFlex",
  "msFlexGrow",
  "msFlexNegative",
  "msFlexOrder",
  "msFlexPositive",
  "msFlexShrink",
  "msGridColumn",
  "msGridColumnSpan",
  "msGridRow",
  "msGridRowSpan",
  "msZoom",
]);

function hyphenate(str: string): string {
  return str
    .replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())
    .replace(/^ms/, "-ms") // IE
    .replace(/^webkit/, "-webkit") // Webkit
    .replace(/^moz/, "-moz"); // Mozilla
}

export function styleObjectToString(styleObj: RuneCSSProperties) {
  return Object.entries(styleObj)
    .map(([key, value]) => {
      const cssKey = hyphenate(key);
      const cssValue =
        typeof value === "number" && !UnitlessNumber.has(key)
          ? `${value}px`
          : value;
      return `${cssKey}:${cssValue};`;
    })
    .join(" ");
}
