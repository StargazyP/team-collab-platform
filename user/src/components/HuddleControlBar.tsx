'use client';

import { useState, useRef, useEffect } from 'react';
import { Track } from 'livekit-client';
import {
  TrackToggle,
  useLocalParticipant,
  useMediaDeviceSelect,
  useDisconnectButton,
} from '@livekit/components-react';
import '@livekit/components-styles';

interface DeviceSelectDropdownProps {
  kind: MediaDeviceKind;
  label: string;
  track?: import('livekit-client').LocalAudioTrack | import('livekit-client').LocalVideoTrack | null;
  disabled?: boolean;
}

function DeviceSelectDropdown({ kind, label, track, disabled }: DeviceSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({
    kind,
    track: track ?? undefined,
    requestPermissions: isOpen,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-700/80 hover:bg-default-600/80 text-white text-sm disabled:opacity-50 transition-colors min-w-[140px]"
      >
        <span className="truncate flex-1 text-left">
          {devices.find((d) => d.deviceId === activeDeviceId)?.label || label}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <ul className="absolute bottom-full left-0 mb-2 py-2 rounded-lg bg-default-800 shadow-lg max-h-48 overflow-y-auto z-50 min-w-[200px]">
          {devices.map((device) => (
            <li key={device.deviceId}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await setActiveMediaDevice(device.deviceId);
                    setIsOpen(false);
                  } catch {
                    setIsOpen(false);
                  }
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-default-700 transition-colors ${
                  device.deviceId === activeDeviceId ? 'text-white bg-default-700/50' : 'text-default-300'
                }`}
              >
                {device.label || `Device ${device.deviceId.slice(0, 8)}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface HuddleControlBarProps {
  canUseMedia?: boolean;
}

export default function HuddleControlBar({ canUseMedia = true }: HuddleControlBarProps) {
  const { microphoneTrack, cameraTrack } = useLocalParticipant();
  const { buttonProps } = useDisconnectButton({ stopTracks: true });
  const { stopTracks: _stopTracks, ...restButtonProps } = buttonProps;

  return (
    <div className="flex flex-col gap-4 p-4 bg-default-900/95 border-t border-default-700 shrink-0">
      {/* 입출력 디바이스 선택 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-default-400 text-sm font-medium shrink-0">입출력</span>
        <div className="flex flex-wrap gap-2">
          <DeviceSelectDropdown
            kind="audioinput"
            label="마이크"
            track={microphoneTrack?.track ?? undefined}
            disabled={!canUseMedia}
          />
          <DeviceSelectDropdown
            kind="videoinput"
            label="카메라"
            track={cameraTrack?.track ?? undefined}
            disabled={!canUseMedia}
          />
          <DeviceSelectDropdown kind="audiooutput" label="스피커" disabled={!canUseMedia} />
        </div>
      </div>

      {/* 트랙 토글 + 통화 끄기 */}
      <div className="flex items-center justify-center gap-4">
        {canUseMedia && (
          <>
            <div className="flex items-center gap-1 [&_.lk-button]:!bg-default-700 [&_.lk-button]:!text-white [&_.lk-button]:!rounded-lg [&_.lk-button]:!px-4 [&_.lk-button]:!py-2 [&_.lk-button:hover]:!bg-default-600">
              <TrackToggle source={Track.Source.Microphone} showIcon>
                <span className="ml-1">마이크</span>
              </TrackToggle>
              <TrackToggle source={Track.Source.Camera} showIcon>
                <span className="ml-1">카메라</span>
              </TrackToggle>
            </div>
            <div className="w-px h-8 bg-default-600" />
          </>
        )}
        <button
          {...restButtonProps}
          type="button"
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-danger-600 hover:bg-danger-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
            />
          </svg>
          통화 끄기
        </button>
      </div>
    </div>
  );
}
