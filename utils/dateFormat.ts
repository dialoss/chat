import { format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';


const timeZone = 'Europe/Moscow'; // Change this to your desired time zone

export const formatDate = (dateString: string, formatString?: string) => {
  if (!dateString) return '';
  if (typeof dateString !== 'string') dateString = dateString.toISOString();
  if (dateString.at(-1) !== 'Z') {
    dateString = dateString + 'Z';
  }
  const date = new Date(dateString);
  
  // if (isToday(date)) {
  //   return format(date, 'HH:mm');
  // } else if (isYesterday(date)) {
  //   return 'Yesterday';
  // } else if (isThisWeek(date)) {
  //   return format(date, 'EEEE'); // Day name
  // } else if (isThisYear(date)) {
  //   return format(date, 'MMM d'); // Month and day
  // } else {
    return format(date, formatString || 'HH:mm MMM d, yyyy'); // Month, day, and year
  // }
};

export const formatTime = (dateString: string | null, onlyZone: boolean = false) => {
  if (!dateString) return '';
  if (typeof dateString !== 'string') dateString = dateString.toISOString();
  if (dateString.at(-1) !== 'Z') {
    dateString = dateString + 'Z';
  }
  const date = new Date(dateString);
  return onlyZone ? date : format(date, 'HH:mm');
};