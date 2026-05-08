/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, memo } from 'react';

function SingleQuoteWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerRef = container.current;
    if (!containerRef) return;
    
    const widgetId = `tv-quote-${Math.random().toString(36).substr(2, 9)}`;
    containerRef.innerHTML = "";
    
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.id = widgetId;
    
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    
    widgetContainer.appendChild(widgetDiv);
    containerRef.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbol": "TVC:USOIL",
      "width": "100%",
      "colorTheme": "dark",
      "isTransparent": true,
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
    <div className="w-full bg-transparent overflow-hidden h-[126px]" ref={container} />
  );
}

export default memo(SingleQuoteWidget);
