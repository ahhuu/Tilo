import type { PriorityLevel, Project } from '@/core/types/domain';
import { format, addDays } from 'date-fns';

export interface ParsedTokenChip {
  type: 'date' | 'time' | 'estimate' | 'priority' | 'project';
  text: string;
  displayValue: string;
}

export interface QuickCaptureParsedResult {
  rawText: string;
  title: string;
  projectId?: string;
  projectName?: string;
  priority: PriorityLevel;
  estimateMinutes?: number;
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  tokens: ParsedTokenChip[];
}

/**
 * Natural Language Fast Parser for Tasks & Timeboxes.
 */
export function parseQuickCaptureInput(
  input: string,
  availableProjects: Project[] = []
): QuickCaptureParsedResult {
  let text = input.trim();
  const tokens: ParsedTokenChip[] = [];
  const today = new Date();

  let priority: PriorityLevel = 'medium';
  let estimateMinutes: number | undefined;
  let scheduledDate: string | undefined;
  let scheduledTime: string | undefined;
  let matchedProject: Project | undefined;

  // 1. Priority Parser (!urgent, !high, !med, !low, !紧急, !高, !中, !低)
  const priorityRegex = /(?:^|\s)!(urgent|high|medium|low|紧急|高|中|低)(?=\s|$)/i;
  const pMatch = text.match(priorityRegex);
  if (pMatch) {
    const rawVal = pMatch[1].toLowerCase();
    if (rawVal === 'urgent' || rawVal === '紧急') priority = 'urgent';
    else if (rawVal === 'high' || rawVal === '高') priority = 'high';
    else if (rawVal === 'low' || rawVal === '低') priority = 'low';
    else priority = 'medium';

    tokens.push({
      type: 'priority',
      text: pMatch[0].trim(),
      displayValue: priority.toUpperCase(),
    });
    text = text.replace(pMatch[0], ' ');
  }

  // 2. Estimate Parser (30m, 45m, 1h, 1.5h, 2h, 30分钟, 1小时, 2小时)
  const estimateRegex = /(?:^|\s)(\d+(?:\.\d+)?)\s*(m|min|mins|h|hr|hrs|分钟|小时)(?=\s|$)/i;
  const estMatch = text.match(estimateRegex);
  if (estMatch) {
    const num = parseFloat(estMatch[1]);
    const unit = estMatch[2].toLowerCase();
    if (unit.startsWith('h') || unit.includes('小时')) {
      estimateMinutes = Math.round(num * 60);
    } else {
      estimateMinutes = Math.round(num);
    }
    tokens.push({
      type: 'estimate',
      text: estMatch[0].trim(),
      displayValue: `${estimateMinutes}m`,
    });
    text = text.replace(estMatch[0], ' ');
  }

  // 3. Project Parser (p:项目名 or #项目名)
  const projectRegex = /(?:^|\s)(?:p:|#)([\w\u4e00-\u9fa5_-]+)(?=\s|$)/i;
  const projMatch = text.match(projectRegex);
  if (projMatch) {
    const projQuery = projMatch[1].toLowerCase();
    matchedProject = availableProjects.find(
      (p) =>
        p.name.toLowerCase() === projQuery ||
        p.name.toLowerCase().includes(projQuery)
    );
    tokens.push({
      type: 'project',
      text: projMatch[0].trim(),
      displayValue: matchedProject ? matchedProject.name : projMatch[1],
    });
    text = text.replace(projMatch[0], ' ');
  }

  // 4. Date Parser (今天, 明天, 后天, 周一..周日, 下周一)
  const dateMap: Record<string, number> = {
    今天: 0,
    today: 0,
    明天: 1,
    tomorrow: 1,
    后天: 2,
  };

  const relDateRegex = /(?:^|\s)(今天|明天|后天|today|tomorrow)(?=\s|$)/i;
  const dateMatch = text.match(relDateRegex);
  if (dateMatch) {
    const offset = dateMap[dateMatch[1].toLowerCase()] ?? 0;
    const target = addDays(today, offset);
    scheduledDate = format(target, 'yyyy-MM-dd');
    tokens.push({
      type: 'date',
      text: dateMatch[0].trim(),
      displayValue: dateMatch[1],
    });
    text = text.replace(dateMatch[0], ' ');
  }

  // 5. Concrete Time Parser (9点, 14:00, 下午3点, 15:30)
  const timeRegex = /(?:^|\s)(?:(上午|下午|晚上)\s*)?(\d{1,2})(?::(\d{2})|点(?:(\d{2})分?)?)?(?=\s|$)/i;
  const timeMatch = text.match(timeRegex);
  if (timeMatch && (timeMatch[1] || timeMatch[3] !== undefined || timeMatch[0].includes('点') || timeMatch[0].includes(':'))) {
    let hour = parseInt(timeMatch[2], 10);
    const minute = parseInt(timeMatch[3] || timeMatch[4] || '0', 10);
    const modifier = timeMatch[1];

    if ((modifier === '下午' || modifier === '晚上') && hour < 12) {
      hour += 12;
    } else if (modifier === '上午' && hour === 12) {
      hour = 0;
    }

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      scheduledTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      if (!scheduledDate) {
        scheduledDate = format(today, 'yyyy-MM-dd');
      }
      tokens.push({
        type: 'time',
        text: timeMatch[0].trim(),
        displayValue: scheduledTime,
      });
      text = text.replace(timeMatch[0], ' ');
    }
  }

  // Clean title
  const cleanTitle = text.replace(/\s+/g, ' ').trim() || input.trim();

  return {
    rawText: input,
    title: cleanTitle,
    projectId: matchedProject?.id,
    projectName: matchedProject?.name,
    priority,
    estimateMinutes,
    scheduledDate,
    scheduledTime,
    tokens,
  };
}
