import { createAnatomy } from "@rune-ui/anatomy";

export const toggleAnatomy = createAnatomy("toggle").parts(
  "root", // 전체 토글 컴포넌트
  "track", // 토글 트랙 (배경)
  "thumb", // 토글 썸 (움직이는 원형 부분)
  "label" // 토글에 연관된 레이블 (선택사항)
);

export const toggleParts = toggleAnatomy.build();
