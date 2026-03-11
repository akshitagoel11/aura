// Date utilities for handling various date formats and relative dates

export function parseRelativeDate(input: string): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Normalize input to lowercase
  const normalized = input.toLowerCase().trim();
  
  // Extract time patterns first (e.g., "8pm", "2:30pm", "8:00 pm", "20:00")
  let targetHour: number | null = null;
  let targetMinute: number = 0;
  
  // Handle 12-hour format with am/pm (e.g., "8pm", "2:30pm", "8:00 pm")
  const timeMatch12h = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (timeMatch12h) {
    const hour = parseInt(timeMatch12h[1]);
    const minute = timeMatch12h[2] ? parseInt(timeMatch12h[2]) : 0;
    const period = timeMatch12h[3];
    
    targetHour = period === 'pm' && hour !== 12 ? hour + 12 : (period === 'am' && hour === 12 ? 0 : hour);
    targetMinute = minute;
  }
  
  // Handle 24-hour format (e.g., "20:00", "14:30")
  const timeMatch24h = normalized.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch24h && !timeMatch12h) {
    targetHour = parseInt(timeMatch24h[1]);
    targetMinute = parseInt(timeMatch24h[2]);
  }
  
  // Handle simple hour format (e.g., "8", "14")
  const simpleHourMatch = normalized.match(/\b(\d{1,2})\b/);
  if (simpleHourMatch && !timeMatch12h && !timeMatch24h) {
    const hour = parseInt(simpleHourMatch[1]);
    // Assume 24-hour format for 13-23, 12-hour for 1-12
    targetHour = hour > 12 ? hour : (hour <= 12 && normalized.includes('pm') ? hour + 12 : hour);
  }
  
  // Determine the base date
  let baseDate = new Date(today);
  
  // Handle "tomorrow"
  if (normalized.includes('tomorrow')) {
    baseDate.setDate(baseDate.getDate() + 1);
  }
  // Handle "today"
  else if (normalized.includes('today')) {
    baseDate = new Date(today);
  }
  // Handle "next week"
  else if (normalized.includes('next week')) {
    baseDate.setDate(baseDate.getDate() + 7);
  }
  // Handle "next month"
  else if (normalized.includes('next month')) {
    baseDate.setMonth(baseDate.getMonth() + 1);
  }
  // Handle specific days of the week
  else {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = today.getDay();
    
    for (let i = 0; i < daysOfWeek.length; i++) {
      if (normalized.includes(daysOfWeek[i])) {
        const daysUntilTarget = (i - currentDay + 7) % 7;
        baseDate.setDate(baseDate.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
        break;
      }
    }
  }
  
  // Apply the extracted time to the base date
  if (targetHour !== null) {
    baseDate.setHours(targetHour, targetMinute, 0, 0);
    return baseDate;
  }
  
  // Handle "in X days/weeks/months"
  const inDaysMatch = normalized.match(/in (\d+) days?/);
  if (inDaysMatch) {
    baseDate.setDate(baseDate.getDate() + parseInt(inDaysMatch[1]));
    return baseDate;
  }
  
  const inWeeksMatch = normalized.match(/in (\d+) weeks?/);
  if (inWeeksMatch) {
    baseDate.setDate(baseDate.getDate() + (parseInt(inWeeksMatch[1]) * 7));
    return baseDate;
  }
  
  const inMonthsMatch = normalized.match(/in (\d+) months?/);
  if (inMonthsMatch) {
    baseDate.setMonth(baseDate.getMonth() + parseInt(inMonthsMatch[1]));
    return baseDate;
  }
  
  // Try to parse as a regular date
  const parsedDate = new Date(input);
  if (!isNaN(parsedDate.getTime())) {
    // If the parsed date is in the past and seems like a mistake, use tomorrow
    if (parsedDate < today) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    return parsedDate;
  }
  
  // Default to tomorrow if no date can be parsed
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function formatTimeForDisplay(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}
