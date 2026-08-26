export type Language = 'zh-CN' | 'en-US';

export const translations = {
  'zh-CN': {
    // Navigation & App Shell
    'nav.today': '今日',
    'nav.inbox': '收集箱',
    'nav.calendar': '日历',
    'nav.goals': '目标与项目',
    'nav.analytics': '统计分析',
    'nav.review': '复盘中心',
    'nav.settings': '系统设置',
    'nav.projects': '项目',
    'nav.collapseSidebar': '收起侧边栏',
    'nav.expandSidebar': '展开侧边栏',

    // Global Search & Palette
    'search.placeholder': '搜索任务、目标或输入指令...',
    'search.button': '搜索或指令',
    'search.quickAction': '快捷操作',
    'search.goToToday': '前往今日',
    'search.goToInbox': '前往收集箱',
    'search.goToCalendar': '前往日历',
    'search.goToGoals': '前往目标',
    'search.goToAnalytics': '前往统计分析',
    'search.goToReview': '前往复盘中心',
    'search.goToSettings': '前往设置',

    // Quick Capture
    'capture.title': '快速收集',
    'capture.placeholder': '记录一个想法、任务或粘贴链接...',
    'capture.save': '存入收集箱',
    'capture.cancel': '取消',
    'capture.hint': '按 Enter 保存，Esc 关闭',

    // Today View
    'today.title': '今日',
    'today.split': '分栏对照',
    'today.list': '清单视图',
    'today.timeline': '时间轴视图',
    'today.dailyFocus': '今日聚焦',
    'today.weeklyFocus': '本周核心目标',
    'today.nextUp': '下一项建议',
    'today.startSession': '开始专注',
    'today.noFocus': '今日暂未设定置顶聚焦任务。从下方拖拽或点击添加。',
    'today.allTasks': '今日所有任务',
    'today.newTask': '新建任务',

    // Calendar
    'calendar.title': '日历排期',
    'calendar.day': '日',
    'calendar.week': '周',
    'calendar.agenda': '议程',
    'calendar.fiveDays': '5 天 (工作日)',
    'calendar.sevenDays': '7 天 (整周)',
    'calendar.planningDrawer': '未排期任务池',
    'calendar.quickSchedule': '快速排期至此',

    // Inbox
    'inbox.title': '收集箱',
    'inbox.unsorted': '待整理',
    'inbox.someday': 'Someday 待办池',
    'inbox.archived': '已归档',
    'inbox.trash': '废纸篓',
    'inbox.convertToTask': '转为任务',
    'inbox.convertToNote': '转为笔记',
    'inbox.batchArchive': '批量归档',
    'inbox.batchSomeday': '批量移至 Someday',
    'inbox.batchDelete': '批量删除',

    // Goals & Projects
    'goals.title': '战略目标与项目',
    'goals.newGoal': '新建目标',
    'goals.newProject': '新建项目',
    'goals.activeGoals': '进行中目标',
    'goals.milestones': '里程碑',
    'goals.progress': '目标进度',

    // Analytics
    'analytics.title': '统计分析与洞察',
    'analytics.thisWeek': '本周',
    'analytics.lastWeek': '上周',
    'analytics.thisMonth': '本月',
    'analytics.lastMonth': '上月',
    'analytics.activeFocus': '活跃专注时长',
    'analytics.plannedTime': '排期总时长',
    'analytics.timeAccuracy': '时间达成率',
    'analytics.taskCompletion': '任务完成率',
    'analytics.dailyRhythm': '每日计划 vs 实际专注对比',
    'analytics.projectAllocation': '项目时间投入分布',
    'analytics.goalAllocation': '战略目标时间投入分布',

    // Review Hub
    'review.title': '复盘中心',
    'review.dailyClose': '每日复盘 (Daily Close)',
    'review.weeklyReview': '每周复盘 (Weekly Review)',
    'review.startDailyClose': '开始今日复盘',
    'review.reopenDailyClose': '重新打开今日复盘',
    'review.startWeeklyReview': '开始本周复盘',
    'review.reopenWeeklyReview': '重新打开本周复盘',
    'review.history': '不可变历史快照',

    // Settings
    'settings.title': '系统设置与工作区',
    'settings.appearance': '外观与显示',
    'settings.motion': '动效令牌',
    'settings.time': '时间与跨日分割',
    'settings.data': '数据备份与还原',
    'settings.shortcuts': '快捷键速查',
    'settings.language': '界面语言',
    'settings.langZh': '简体中文 (Chinese)',
    'settings.langEn': 'English (英语)',
  },
  'en-US': {
    // Navigation & App Shell
    'nav.today': 'Today',
    'nav.inbox': 'Inbox',
    'nav.calendar': 'Calendar',
    'nav.goals': 'Goals & Projects',
    'nav.analytics': 'Analytics',
    'nav.review': 'Review Hub',
    'nav.settings': 'Settings',
    'nav.projects': 'Projects',
    'nav.collapseSidebar': 'Collapse sidebar',
    'nav.expandSidebar': 'Expand sidebar',

    // Global Search & Palette
    'search.placeholder': 'Search tasks, goals or type commands...',
    'search.button': 'Search or command',
    'search.quickAction': 'Quick Actions',
    'search.goToToday': 'Go to Today',
    'search.goToInbox': 'Go to Inbox',
    'search.goToCalendar': 'Go to Calendar',
    'search.goToGoals': 'Go to Goals',
    'search.goToAnalytics': 'Go to Analytics',
    'search.goToReview': 'Go to Review',
    'search.goToSettings': 'Go to Settings',

    // Quick Capture
    'capture.title': 'Instant Capture',
    'capture.placeholder': 'Jot down an idea, task or paste link...',
    'capture.save': 'Save to Inbox',
    'capture.cancel': 'Cancel',
    'capture.hint': 'Press Enter to save, Esc to dismiss',

    // Today View
    'today.title': 'Today',
    'today.split': 'Split View',
    'today.list': 'List View',
    'today.timeline': 'Timeline View',
    'today.dailyFocus': 'Daily Focus',
    'today.weeklyFocus': 'Weekly Strategic Focus',
    'today.nextUp': 'Next Up',
    'today.startSession': 'Start Focus',
    'today.noFocus': 'No daily focus items set yet. Drag tasks here to prioritize.',
    'today.allTasks': 'All Tasks for Today',
    'today.newTask': 'New Task',

    // Calendar
    'calendar.title': 'Calendar Planning',
    'calendar.day': 'Day',
    'calendar.week': 'Week',
    'calendar.agenda': 'Agenda',
    'calendar.fiveDays': '5 Days (Workweek)',
    'calendar.sevenDays': '7 Days (Full Week)',
    'calendar.planningDrawer': 'Unscheduled Tasks',
    'calendar.quickSchedule': 'Schedule Here',

    // Inbox
    'inbox.title': 'Inbox',
    'inbox.unsorted': 'Unsorted',
    'inbox.someday': 'Someday Backlog',
    'inbox.archived': 'Archived',
    'inbox.trash': 'Trash',
    'inbox.convertToTask': 'Convert to Task',
    'inbox.convertToNote': 'Convert to Note',
    'inbox.batchArchive': 'Archive Selected',
    'inbox.batchSomeday': 'Move to Someday',
    'inbox.batchDelete': 'Delete Selected',

    // Goals & Projects
    'goals.title': 'Goals & Projects',
    'goals.newGoal': 'New Goal',
    'goals.newProject': 'New Project',
    'goals.activeGoals': 'Active Goals',
    'goals.milestones': 'Milestones',
    'goals.progress': 'Goal Progress',

    // Analytics
    'analytics.title': 'Analytics & Insights',
    'analytics.thisWeek': 'This Week',
    'analytics.lastWeek': 'Last Week',
    'analytics.thisMonth': 'This Month',
    'analytics.lastMonth': 'Last Month',
    'analytics.activeFocus': 'Active Focus Time',
    'analytics.plannedTime': 'Planned Time',
    'analytics.timeAccuracy': 'Time Accuracy',
    'analytics.taskCompletion': 'Task Completion Rate',
    'analytics.dailyRhythm': 'Daily Plan vs Actual Focus',
    'analytics.projectAllocation': 'Project Time Allocation',
    'analytics.goalAllocation': 'Goal Strategic Allocation',

    // Review Hub
    'review.title': 'Review Hub',
    'review.dailyClose': 'Daily Close',
    'review.weeklyReview': 'Weekly Review',
    'review.startDailyClose': 'Start Daily Close',
    'review.reopenDailyClose': 'Reopen Daily Close',
    'review.startWeeklyReview': 'Start Weekly Review',
    'review.reopenWeeklyReview': 'Reopen Weekly Review',
    'review.history': 'Immutable Revision History',

    // Settings
    'settings.title': 'Settings & Workspace',
    'settings.appearance': 'Appearance & Display',
    'settings.motion': 'Motion Tokens',
    'settings.time': 'Time & Cutoffs',
    'settings.data': 'Data Backup & Restore',
    'settings.shortcuts': 'Shortcuts Cheat Sheet',
    'settings.language': 'Language',
    'settings.langZh': '简体中文 (Chinese)',
    'settings.langEn': 'English (US)',
  },
} as const;

export type TranslationKey = keyof typeof translations['zh-CN'];
