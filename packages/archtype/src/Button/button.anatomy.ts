import { createAnatomy } from "@rune-ui/anatomy";

export const buttonAnatomy = createAnatomy("button").parts(
  "root", // 전체 버튼 컴포넌트
  "inner", // 버튼 내부 요소
  "label", // 버튼 레이블
  "leftIcon", // 왼쪽 아이콘
  "rightIcon" // 오른쪽 아이콘
);

export const buttonParts = buttonAnatomy.build();
