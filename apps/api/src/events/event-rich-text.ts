import sanitizeHtml from 'sanitize-html';

const allowedTags = [
  'a',
  'blockquote',
  'br',
  'em',
  'h2',
  'h3',
  'img',
  'li',
  'ol',
  'p',
  's',
  'strong',
  'u',
  'ul',
];

export function sanitizeEventRichText(value: string): string {
  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        target: '_blank',
        rel: 'noopener noreferrer',
      }),
    },
  }).trim();
}
