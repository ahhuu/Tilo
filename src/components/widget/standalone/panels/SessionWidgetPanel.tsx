import React from 'react';
import { Volume2 } from 'lucide-react';
import { useWidgetStore } from '@/stores/widgetStore';
import { ambientAudioService, type AmbientSoundType } from '@/core/audio/ambientAudioService';
import { PanelRow, TogglePill, panelSelectClass } from './PanelBits';

type AmbientSoundOption = 'none' | 'rain' | 'whitenoise' | 'birds' | 'fireplace';

/** 专注计时挂件的专属深度配置。 */
export const SessionWidgetPanel: React.FC = () => {
  const { settings, updateGridSettings } = useWidgetStore();
  const conf = settings.gridSettings.session;

  const handleAmbientSoundChange = (sound: AmbientSoundOption) => {
    updateGridSettings('session', { ambientSound: sound });
    if (sound === 'none') {
      ambientAudioService.stop();
    } else {
      const typeMap: Record<string, AmbientSoundType> = {
        rain: 'rain',
        whitenoise: 'white_noise',
        birds: 'waves',
        fireplace: 'white_noise',
      };
      const soundType = typeMap[sound] || 'rain';
      ambientAudioService.playSound(soundType);
    }
  };

  return (
    <div className="space-y-2.5">
      <PanelRow label="默认专注时长：">
        <select
          value={conf.defaultDurationMinutes}
          onChange={(e) => updateGridSettings('session', { defaultDurationMinutes: Number(e.target.value) })}
          className={panelSelectClass}
        >
          <option value={15}>15 分钟 (快速冲刺)</option>
          <option value={25}>25 分钟 (经典番茄)</option>
          <option value={45}>45 分钟 (深度心流)</option>
          <option value={60}>60 分钟 (长时专注)</option>
          <option value={0}>自由计时 (正向秒表)</option>
        </select>
      </PanelRow>

      <PanelRow
        label={
          <>
            <Volume2 className="w-3 h-3 text-indigo-600" />
            <span>伴随背景白噪音：</span>
          </>
        }
      >
        <select
          value={conf.ambientSound}
          onChange={(e) => handleAmbientSoundChange(e.target.value as AmbientSoundOption)}
          className={panelSelectClass}
        >
          <option value="none">无 (静音)</option>
          <option value="rain">自然雨声</option>
          <option value="whitenoise">白噪音</option>
          <option value="birds">森林鸟鸣</option>
          <option value="fireplace">壁炉炭火</option>
        </select>
      </PanelRow>

      <PanelRow label="专注结束自动勾选完成任务：">
        <TogglePill
          on={conf.autoCompleteTaskOnFinish}
          label={conf.autoCompleteTaskOnFinish ? '开启' : '关闭'}
          onClick={() =>
            updateGridSettings('session', { autoCompleteTaskOnFinish: !conf.autoCompleteTaskOnFinish })
          }
        />
      </PanelRow>
    </div>
  );
};
