import { useEffect, useState, useRef } from 'react';
import { API_BASE } from '../config';

interface AdSlotProps {
  slot: 'top' | 'bottom' | 'movie-series' | 'celebrity' | 'player' | 'news-top' | 'news-bottom' | 'homepage-bottom';
  style?: React.CSSProperties;
}

// Shared cache so all instances only fetch once
let cachedSettings: Record<string, string> | null = null;
let fetchPromise: Promise<Record<string, string>> | null = null;

async function getAdSettings(): Promise<Record<string, string>> {
  if (cachedSettings) return cachedSettings;
  if (!fetchPromise) {
    fetchPromise = fetch(`${API_BASE}/admin_settings.php?group=ads`)
      .then(r => r.json())
      .then(data => {
        cachedSettings = data;
        return data;
      });
  }
  return fetchPromise;
}

export default function AdSlot({ slot, style }: AdSlotProps) {
  const [adCode, setAdCode] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [ready, setReady] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAdSettings().then(data => {
      const isDisabled = data['ads.disabled'] === '1';
      setDisabled(isDisabled);
      setAdCode(data[`ads.${slot}`] || '');
      setReady(true);
    });
  }, [slot]);

  useEffect(() => {
    if (ready && slotRef.current) {
      const slotEl = slotRef.current;
      
      if (!adCode) {
        slotEl.innerHTML = '';
        return;
      }

      slotEl.innerHTML = adCode;
      
      // Manually execute scripts because innerHTML doesn't
      const scripts = Array.from(slotEl.querySelectorAll('script'));
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [ready, adCode]);

  if (!ready || disabled) return null;

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...style
      }}
    >
      {adCode ? (
        <div 
          ref={slotRef} 
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        />
      ) : (
        <img
          src="/assets/icons/placeholder-1200x150.webp"
          alt="Ad Placeholder"
          style={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            opacity: 0.6
          }}
        />
      )}
    </div>
  );
}
