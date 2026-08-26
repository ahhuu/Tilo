import React, { useState } from 'react';
import { useUIStore, type MotionLevel } from '@/stores/uiStore';
import { useI18n } from '@/core/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Zap, Play, Sparkles, ShieldCheck, Layers, Eye, RefreshCw, PanelRightOpen, CheckCircle2 } from 'lucide-react';

export const MotionSection: React.FC = () => {
  const { language } = useI18n();
  const { motionLevel, setMotionLevel } = useUIStore();
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoCounter, setDemoCounter] = useState(0);

  const options: { id: MotionLevel; title: string; speedTag: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'reduced',
      title: language === 'zh-CN' ? '减弱动效 (Reduced Motion)' : 'Reduced Motion',
      speedTag: '0ms (瞬间响应)',
      desc: language === 'zh-CN' ? '完全关闭所有弹窗缩放、抽屉滑入与过度动画，点击瞬间呈现，适配无障碍与零等待偏好。' : 'Disables all non-essential animations. 0ms instant layout transition.',
      icon: ShieldCheck,
    },
    {
      id: 'subtle',
      title: language === 'zh-CN' ? '克制微动效 (Subtle)' : 'Subtle',
      speedTag: '100ms (极速)',
      desc: language === 'zh-CN' ? '极速干练过渡，100ms 内完成轻微视觉渐变，兼顾视觉定位与高效操作。' : 'Fast, minimal visual transitions under 100ms.',
      icon: Zap,
    },
    {
      id: 'balanced',
      title: language === 'zh-CN' ? '均衡默认 (Balanced)' : 'Balanced (Default)',
      speedTag: '200ms (标准平滑)',
      desc: language === 'zh-CN' ? '克制平滑的桌面端交互过渡，抽屉顺滑滑入、弹窗轻微淡入，系统默认推荐。' : 'Restrained, smooth transitions engineered for desktop fluidity.',
      icon: Play,
    },
    {
      id: 'expressive',
      title: language === 'zh-CN' ? '生动丰富 (Expressive)' : 'Expressive',
      speedTag: '380ms (弹性缓动)',
      desc: language === 'zh-CN' ? '完整的弹性贝塞尔曲线过渡（Spring easing），抽屉与对话框富有灵动呼吸感。' : 'Rich layout micro-animations and spring transitions.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {language === 'zh-CN' ? '动效与动画令牌' : 'Motion & Animations'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'zh-CN'
              ? '全局调节弹窗（Modal）、侧边抽屉（Drawer）、时间轴弹窗与按钮悬停的过渡速率。'
              : 'Configure UI transitions and motion tokens across dialogs, drawers, and timelines.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = motionLevel === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMotionLevel(opt.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      {opt.title}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {opt.speedTag}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Live Playground Sandbox */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === 'zh-CN' ? '实时动效沙盒演示 (点击立即测试体感)' : 'Live Motion Playground'}</span>
            </div>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
              {language === 'zh-CN' ? `当前生效档位: ${motionLevel.toUpperCase()}` : `Active Level: ${motionLevel}`}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setDemoOpen(!demoOpen);
                  setDemoCounter((c) => c + 1);
                }}
                className="h-8 text-xs gap-1.5 cursor-pointer shadow-xs"
              >
                <PanelRightOpen className="w-3.5 h-3.5" />
                <span>{demoOpen ? (language === 'zh-CN' ? '关闭测试抽屉' : 'Close Drawer') : (language === 'zh-CN' ? '触发测试抽屉滑入' : 'Test Drawer Slide')}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setDemoCounter((c) => c + 1)}
                className="h-8 text-xs gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'zh-CN' ? '重放弹性元素' : 'Replay Element'}</span>
              </Button>
            </div>

            {/* Test Animation Elements */}
            <div className="flex items-center gap-3">
              {/* Dynamic Animated Pulse Box */}
              <div
                key={`anim-box-${demoCounter}`}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-md animate-in zoom-in-90 slide-in-from-bottom-2 fade-in"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-200" />
                <span>{language === 'zh-CN' ? '弹窗动效预览' : 'Modal Popup Demo'}</span>
              </div>
            </div>
          </div>

          {/* Test Drawer Simulation */}
          {demoOpen && (
            <div
              className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 shadow-xl flex items-center justify-between animate-in slide-in-from-right-8 fade-in duration-200"
            >
              <div className="flex items-center gap-2 text-xs">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {language === 'zh-CN' ? '抽屉与时间轴平滑动效已生效' : 'Drawer & Timeline Smooth Transition'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {language === 'zh-CN'
                      ? `当前速率：${motionLevel === 'reduced' ? '0ms 瞬间打开（无过渡）' : motionLevel === 'subtle' ? '100ms 极速快闪' : motionLevel === 'balanced' ? '200ms 标准平滑' : '380ms 弹性缓动'}`
                      : `Active duration: ${motionLevel}`}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDemoOpen(false)}
                className="h-7 text-xs cursor-pointer"
              >
                {language === 'zh-CN' ? '收起' : 'Close'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
