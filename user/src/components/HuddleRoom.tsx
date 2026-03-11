'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RoomEvent, Track } from 'livekit-client';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ConnectionStateToast,
  useTracks,
  useLocalParticipant,
  useTrackVolume,
} from '@livekit/components-react';
import '@livekit/components-styles';
import HuddleControlBar from './HuddleControlBar';

const SPEAKING_THRESHOLD_ON = 0.06;
const SPEAKING_THRESHOLD_OFF = 0.04;

function VoiceActivityReporter({ onSpeakingChange }: { onSpeakingChange?: (speaking: boolean) => void }) {
  const { microphoneTrack } = useLocalParticipant();
  const track = microphoneTrack?.track ?? undefined;
  const volume = useTrackVolume(track, { fftSize: 32, smoothingTimeConstant: 0.5 });
  const prevSpeaking = useRef(false);
  const offTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!onSpeakingChange) return;
    if (volume >= SPEAKING_THRESHOLD_ON) {
      if (offTimeout.current) {
        clearTimeout(offTimeout.current);
        offTimeout.current = null;
      }
      if (!prevSpeaking.current) {
        prevSpeaking.current = true;
        onSpeakingChange(true);
      }
    } else if (volume < SPEAKING_THRESHOLD_OFF) {
      if (prevSpeaking.current && !offTimeout.current) {
        offTimeout.current = setTimeout(() => {
          prevSpeaking.current = false;
          onSpeakingChange(false);
          offTimeout.current = null;
        }, 120);
      }
    }
  }, [volume, onSpeakingChange]);

  return null;
}

/** 카메라/마이크는 HTTPS 또는 localhost에서만 사용 가능 (getUserMedia 보안 정책) */
const isSecureContext = () =>
  typeof window !== 'undefined' && window.isSecureContext;

interface HuddleRoomChannelProps {
  channelId: number;
  channelName: string;
  workspaceId?: never;
  workspaceName?: never;
}

interface HuddleRoomWorkspaceProps {
  channelId?: never;
  channelName?: never;
  workspaceId: number;
  workspaceName: string;
}

type HuddleRoomProps = (HuddleRoomChannelProps | HuddleRoomWorkspaceProps) & {
  onLeave?: () => void;
  pip?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
};

function HuddleConferenceContentInner({
  canUseMedia,
  pip,
  onSpeakingChange,
}: {
  canUseMedia: boolean;
  pip?: boolean;
  onSpeakingChange?: (speaking: boolean) => void;
}) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
  );

  return (
    <div className="lk-video-conference flex flex-col h-full">
      <VoiceActivityReporter onSpeakingChange={onSpeakingChange} />
      <div className="flex-1 min-h-0 lk-grid-layout-wrapper overflow-auto">
        <GridLayout tracks={tracks}>
          <ParticipantTile />
        </GridLayout>
      </div>
      {!pip && <HuddleControlBar canUseMedia={canUseMedia} />}
      <RoomAudioRenderer />
      {!pip && <ConnectionStateToast />}
    </div>
  );
}

export default function HuddleRoom(props: HuddleRoomProps) {
  const { onLeave, pip = false, onSpeakingChange } = props;
  const isWorkspace = 'workspaceId' in props && props.workspaceId != null;
  const roomLabel = isWorkspace ? props.workspaceName : props.channelName!;

  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [room, setRoom] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    const body = isWorkspace
      ? { workspaceId: props.workspaceId }
      : { channelId: props.channelId };
    try {
      const res = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '토큰 발급 실패');
      }
      setToken(data.token);
      setUrl(data.url);
      setRoom(data.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isWorkspace, isWorkspace ? props.workspaceId : props.channelId]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-content1">
        <div className="text-default-600">허들에 연결 중...</div>
      </div>
    );
  }

  if (error || !token || !url || !room) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-content1 gap-4 p-6">
        <p className="text-danger-600 text-center">{error || '연결할 수 없습니다.'}</p>
        <p className="text-sm text-default-500 text-center">
          LiveKit 설정(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)을 확인하세요.
        </p>
        <button
          type="button"
          onClick={fetchToken}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const canUseMedia = isSecureContext();

  return (
    <div className="flex flex-col h-full">
      {!pip && (
        <div className="px-4 py-2 bg-primary text-primary-foreground flex items-center justify-between shrink-0">
          <span className="font-semibold">허들: {roomLabel}</span>
          {!canUseMedia && (
            <span className="text-xs text-amber-200">
              카메라/마이크: localhost 또는 HTTPS에서만 사용 가능
            </span>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0 bg-default-900 [&_.lk-video-conference]:h-full">
        <LiveKitRoom
          token={token}
          serverUrl={url}
          connect={true}
          audio={canUseMedia}
          video={canUseMedia}
          onDisconnected={onLeave}
          options={{
            adaptiveStream: true,
            dynacast: true,
            publishDefaults: {
              simulcast: true,
            },
          }}
        >
          <HuddleConferenceContentInner canUseMedia={canUseMedia} pip={pip} onSpeakingChange={onSpeakingChange} />
        </LiveKitRoom>
      </div>
    </div>
  );
}
