export function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const blacklistTags = [
      'script', 'iframe', 'object', 'embed', 'form', 'button', 
      'input', 'textarea', 'select', 'meta', 'link', 'style', 'base'
    ];
    
    const cleanNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        
        if (blacklistTags.includes(tagName)) {
          el.parentNode?.removeChild(el);
          return;
        }
        
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          const attrName = attr.name.toLowerCase();
          const attrValue = attr.value.toLowerCase().trim();
          
          if (attrName.startsWith('on')) {
            el.removeAttribute(attr.name);
          } else if (['href', 'src', 'action'].includes(attrName)) {
            if (attrValue.startsWith('javascript:') || attrValue.startsWith('data:text/html') || attrValue.startsWith('vbscript:')) {
              el.removeAttribute(attr.name);
            }
          }
        }
      }
      
      const children = Array.from(node.childNodes);
      for (const child of children) {
        cleanNode(child);
      }
    };
    
    cleanNode(doc.body);
    return doc.body.innerHTML;
  } catch (error) {
    console.error('HTML Sanitization error:', error);
    return '';
  }
}
