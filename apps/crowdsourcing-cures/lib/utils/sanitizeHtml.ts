import DOMPurify from 'isomorphic-dompurify'

export const sanitizeHtml = (html: string) => DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'li', 'ol'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  }) 