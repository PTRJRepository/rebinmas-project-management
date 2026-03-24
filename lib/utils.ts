import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPlainTextPreview(html: string | null | undefined, maxLength: number = 150): string {
  if (!html) return '';
  // Remove HTML tags
  const plainText = html.replace(/<[^>]*>?/gm, ' ');
  // Decode entities
  const decoded = plainText
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  
  const trimmed = decoded.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength) + '...';
}
