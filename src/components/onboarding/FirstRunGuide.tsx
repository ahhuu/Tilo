import React, { useEffect, useRef, useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useI18n } from '@/core/i18n';
import {
  Sparkles,
  Smartphone,
  Monitor,
  BarChart3,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const FIRST_RUN_ONBOARDING_KEY = 'tilo_has_seen_onboarding';
export const DEMO_DATA_SEEDED_KEY = 'tilo_demo_data_seeded';

interface FirstRunGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepContent {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}

export const FirstRunGuide: React.FC<FirstRunGuideProps> = ({ isOpen, onClose }) => {
  const { language } = useI18n();
  const [step, setStep] = useState(0);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const isZh = language === 'zh-CN';

  const steps: StepContent[] = [
    {
      icon: <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      title: isZh ? '欢迎使用 Tilo' : 'Welcome to Tilo',
      body: (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
            {isZh
              ? 'Tilo 是一款本地优先的执行系统：把目标拆成项目与任务，在桌面端规划、在手机端随手记录与执行，再用复盘把「计划」和「实际」对比——让差异被看见。'
              : 'Tilo is a local-first execution system: break goals into projects and tasks, plan on desktop, capture and execute on the go, then review plan against actual to make the gap visible.'}
          </p>
          <div className="flex items-center justify-center gap-2 py-1">
            {[
              { label: isZh ? '规划' : 'Plan', sub: isZh ? '桌面端' : 'Desktop' },
              { label: isZh ? '执行' : 'Execute', sub: isZh ? '手机端' : 'Mobile' },
              { label: isZh ? '复盘' : 'Review', sub: isZh ? '对比差异' : 'Compare' },
            ].map((pill, i) => (
              <React.Fragment key={pill.label}>
                <div className="flex flex-col items-center px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                    {pill.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{pill.sub}</span>
                </div>
                {i < 2 && <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      title: isZh ? '手机记录，电脑规划' : 'Capture on phone, plan on desktop',
      body: (
        <ul className="space-y-3 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          <li className="flex gap-2.5">
            <Smartphone className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
            <span>
              {isZh
                ? '手机端：用右下角悬浮按钮或快捷键随手速记闪念，专注计时也在这里开始——零摩擦地捕捉当下。'
                : 'On mobile: capture thoughts instantly via the floating button or a hotkey, and start focus timers right where you are.'}
            </span>
          </li>
          <li className="flex gap-2.5">
            <Monitor className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
            <span>
              {isZh
                ? '电脑端：在日历、今日、复盘页做规划与回顾；连同一 WiFi 时与手机一键同步，数据完全在本地，不经任何云端。'
                : 'On desktop: plan and review in Calendar, Today, and Review. Over the same Wi-Fi it syncs with your phone peer-to-peer—no cloud in between.'}
            </span>
          </li>
        </ul>
      ),
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      title: isZh ? '先看看效果' : 'See it in action first',
      body: (
        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
          {isZh
            ? '我们已为你载入一份示例工作区（目标、项目、任务、专注记录都有）。你可以直接打开「分析」页，感受计划 vs 实际的差异。体验完毕后，随时在「设置 → 数据」一键清空，换成你自己的规划。'
            : 'We have loaded a sample workspace for you (goals, projects, tasks, focus records). Open the Analytics page to feel the plan-vs-actual gap. When ready, clear it anytime in Settings → Data and start your own.'}
        </p>
      ),
    },
  ];

  // 每次打开都回到第一步，并把焦点放到主操作按钮
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      const t = setTimeout(() => primaryRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleClose = () => {
    localStorage.setItem(FIRST_RUN_ONBOARDING_KEY, 'true');
    onClose();
  };

  const isLast = step === steps.length - 1;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel={isZh ? 'Tilo 新手引导' : 'Tilo onboarding'}
      maxWidthClass="sm:max-w-md"
    >
      {/* 步骤指示 */}
      <div className="flex items-center gap-1.5 mb-4" aria-hidden="true">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= step ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-slate-200 dark:bg-slate-800'
            )}
          />
        ))}
      </div>

      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
          {steps[step].icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {steps[step].title}
          </h3>
        </div>
      </div>

      <div className="mt-3 text-slate-600 dark:text-slate-300">{steps[step].body}</div>

      {/* 底部操作区 */}
      <div className="flex items-center justify-between gap-2 mt-6">
        <button
          type="button"
          onClick={handleClose}
          className="text-[13px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer px-1 py-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {isZh ? '跳过' : 'Skip'}
        </button>

        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {isZh ? '上一步' : 'Back'}
            </button>
          )}
          <button
            ref={primaryRef}
            type="button"
            onClick={() => (isLast ? handleClose() : setStep((s) => s + 1))}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            {isLast ? (isZh ? '开始使用' : 'Get started') : (isZh ? '下一步' : 'Next')}
            {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default FirstRunGuide;
