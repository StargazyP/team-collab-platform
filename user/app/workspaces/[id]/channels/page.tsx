'use client';

/**
 * /channels 경로 - 좌측 채널 아이콘 클릭 시 슬라이드 패널로 채널 목록이 표시됩니다.
 * 이 페이지는 /channels로 직접 접근 시 안내만 표시합니다.
 */
export default function WorkspaceChannelsPage() {
  return (
    <div className="p-6 flex items-center justify-center min-h-[300px]">
      <p className="text-default-500 text-center">
        좌측 <strong>채널</strong> 아이콘을 클릭하면 채널 목록이 슬라이드로 표시됩니다.
      </p>
    </div>
  );
}
