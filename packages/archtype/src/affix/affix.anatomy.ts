import { createAnatomy } from "@rune-ui/anatomy";

export const affixAnatomy = createAnatomy("affix").parts(
  "root", // 전체 Affix 컴포넌트
  "content", // Affix 내부 콘텐츠
);

export const affixParts = affixAnatomy.build();
