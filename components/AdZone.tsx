
import React, { useEffect, useRef } from 'react';

interface AdZoneProps {
  scriptCode: string;
  id: string;
}

const AdZone: React.FC<AdZoneProps> = ({ scriptCode, id }) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && scriptCode) {
      // Membersihkan zona iklan sebelum menyuntikkan script baru
      adRef.current.innerHTML = '';
      const range = document.createRange();
      const fragment = range.createContextualFragment(scriptCode);
      adRef.current.appendChild(fragment);
    }
  }, [scriptCode]);

  if (!scriptCode) return null;

  return (
    <div className="w-full min-h-[50px] bg-slate-900/20 flex items-center justify-center my-4 overflow-hidden rounded-xl border border-dashed border-slate-800">
      <div ref={adRef} id={`ad-zone-${id}`} className="w-full text-center text-[8px] text-slate-700 uppercase tracking-widest py-2">
        Iklan Terpasang
      </div>
    </div>
  );
};

export default AdZone;
