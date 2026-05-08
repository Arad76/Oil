/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, memo } from 'react';

function LivePriceTape() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerRef = container.current;
    if (!containerRef) return;
    
    const widgetId = `tv-tape-${Math.random().toString(36).substr(2, 9)}`;
    containerRef.innerHTML = "";
    
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.id = widgetId;
    
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    
    widgetContainer.appendChild(widgetDiv);
    containerRef.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbols": [
        { "proName": "FOREXCOM:SPX500", "title": "S&P 500 Index" },
        { "proName": "TVC:USOIL", "title": "WTI Crude Oil" },
        { "proName": "TVC:UKOIL", "title": "Brent Crude" }
      ],
      "showSymbolLogo": true,
      "colorTheme": "dark",
      "displayMode": "adaptive",
      "locale": "en",
      "container_id": widgetId
    });
    
    const timeoutId = setTimeout(() => {
      if (widgetContainer) {
        widgetContainer.appendChild(script);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (containerRef) {
        containerRef.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="w-full bg-oil-black border-b border-oil-border overflow-hidden h-[46px]" ref={container} />
  );
}

export default memo(LivePriceTape);
