
/**
 * Helper untuk mengekstrak URL src dari kode embed iframe Doodstream
 * Wajib berupa tag <iframe> agar dianggap valid.
 */
export const extractSrcFromEmbed = (embedCode: string): string | null => {
  // Regex untuk mencari atribut src di dalam tag iframe
  const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/;
  const match = embedCode.match(iframeRegex);
  
  if (match && match[1]) {
    let url = match[1];
    // Pastikan URL menggunakan protokol https
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }
    return url;
  }
  
  return null;
};

/**
 * Mengambil file code unik dari URL Doodstream
 */
export const extractFileCode = (input: string): string => {
  // Jika input adalah kode embed, ekstrak src dulu
  const url = extractSrcFromEmbed(input) || input;
  
  const parts = url.split('/');
  let lastPart = parts[parts.length - 1];
  
  // Jika URL berakhir dengan slash
  if (!lastPart && parts.length > 1) {
    lastPart = parts[parts.length - 2];
  }
  
  return lastPart;
};

export const getEmbedUrl = (input: string) => {
    const src = extractSrcFromEmbed(input);
    if (src) return src;
    
    // Fallback jika hanya punya kode (bukan link)
    if (!input.includes('http') && input.length > 5) {
        return `https://dood.to/e/${input}`;
    }
    
    return null;
};
