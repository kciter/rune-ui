import { createAnatomy } from "@rune-ui/anatomy";

export const collapsibleAnatomy = createAnatomy("collapsible").parts(
  "root", // 전체 Collapsible 컴포넌트
  "trigger", // 펼치기/접기를 위한 트리거 버튼
  "indicator", // 펼침/접힘 상태를 나타내는 표시자 (화살표 등)
  "content", // 펼쳐질 때 표시되는 내용
);

export const collapsibleParts = collapsibleAnatomy.build();
