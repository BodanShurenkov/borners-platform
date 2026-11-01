'use client';

import React from 'react';
import { PackColor } from '@/lib/scenarioData';

export function BoxerPackStackSvg({
  colors,
  large = false,
  brandLabel = 'BORNERS',
  category = 'pack',
  customPhotoUrl,
}: {
  colors: PackColor[];
  large?: boolean;
  brandLabel?: string;
  category?: 'pack' | 'single' | 'waistband' | 'fabric' | 'fit' | 'video';
  customPhotoUrl?: string;
}) {
  if (customPhotoUrl) {
    return (
      <div
        className={`relative w-full flex items-center justify-center overflow-hidden rounded-[14px] ${
          large ? 'h-[260px]' : 'h-[155px]'
        }`}
      >
        <img
          src={customPhotoUrl}
          alt={brandLabel}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  const primary = colors[0] || {
    nameRu: 'Основной тон',
    pantone: 'PANTONE',
    hex: '#D48B92',
    bandHex: '#C67A82',
    textHex: '#9E545D',
  };

  if (category === 'waistband') {
    return (
      <div
        className={`relative w-full flex flex-col items-center justify-center gap-3 p-4 select-none ${
          large ? 'h-[260px]' : 'h-[155px]'
        }`}
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A756C]">
          Макро-деталь · Жаккардовая резинка 38 мм в тон ткани
        </div>
        {colors.slice(0, 3).map((c) => (
          <div
            key={c.nameRu}
            className="w-full max-w-[320px] h-11 rounded-[10px] border border-black/10 shadow-xs flex items-center justify-around px-4 font-extrabold text-[12px] tracking-[0.22em]"
            style={{ backgroundColor: c.bandHex, color: c.textHex }}
          >
            <span>{brandLabel}</span>
            <span>{brandLabel}</span>
            <span>{brandLabel}</span>
          </div>
        ))}
      </div>
    );
  }

  if (category === 'fabric') {
    return (
      <div
        className={`relative w-full flex flex-col items-center justify-center gap-3 p-4 select-none ${
          large ? 'h-[260px]' : 'h-[155px]'
        }`}
      >
        <div className="grid grid-cols-4 gap-2.5 w-full max-w-[320px]">
          {colors.map((c) => (
            <div key={c.nameRu} className="space-y-1 text-center">
              <div
                className="h-24 rounded-[12px] border border-black/10 shadow-inner"
                style={{
                  backgroundColor: c.hex,
                  backgroundImage:
                    'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 0)',
                  backgroundSize: '5px 5px',
                }}
              />
              <div className="text-[10px] font-bold text-[#1D1D1F] truncate">
                {c.nameRu}
              </div>
              <div className="text-[9px] text-[#7A756C] font-mono truncate">
                {c.pantone.replace('PANTONE ', '')}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (category === 'fit') {
    return (
      <div
        className={`relative w-full flex flex-col items-center justify-center p-3 select-none ${
          large ? 'h-[260px]' : 'h-[155px]'
        }`}
      >
        <TechnicalFlatDrawingSvg />
      </div>
    );
  }

  if (category === 'video') {
    return (
      <div
        className={`relative w-full flex flex-col items-center justify-center gap-2 rounded-[14px] bg-[#1D1D1F] text-white p-4 select-none ${
          large ? 'h-[260px]' : 'h-[155px]'
        }`}
      >
        <div className="h-12 w-12 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-[18px]">
          ▶
        </div>
        <div className="text-[13px] font-bold">Видео-обзор посадки и растяжения</div>
        <div className="text-[11px] text-white/65">
          Тест эластичности пояса 38 мм и швов Flatlock · 00:42
        </div>
      </div>
    );
  }

  const renderColors = category === 'single' ? [primary] : colors;
  const count = renderColors.length;

  return (
    <div
      className={`relative w-full flex items-center justify-center select-none ${
        large ? 'h-[260px]' : 'h-[155px]'
      }`}
    >
      <svg
        viewBox="0 0 320 230"
        className="w-full h-full drop-shadow-[0_10px_18px_rgba(24,23,21,0.10)]"
      >
        {renderColors
          .slice()
          .reverse()
          .map((col, revIdx) => {
            const idx = count - 1 - revIdx;
            const offsetY = count === 1 ? 38 : idx * (count === 4 ? 22 : 27);
            const offsetX = count === 1 ? 12 : (count - 1 - idx) * 6;
            const rot = count === 1 ? 0 : -3.5 + idx * 1.1;
            return (
              <g
                key={col.nameRu}
                transform={`translate(${18 + offsetX}, ${14 + offsetY}) rotate(${rot}, 135, 70)`}
              >
                <path
                  d="M 22 24 L 248 24 L 264 128 C 240 133, 195 132, 172 126 L 154 96 C 145 106, 125 106, 116 96 L 98 126 C 75 132, 30 133, 6 128 Z"
                  fill={col.hex}
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="1.2"
                />
                {idx === count - 1 && (
                  <>
                    <path
                      d="M 106 26 C 102 68, 112 96, 135 102 C 158 96, 168 68, 164 26"
                      fill="none"
                      stroke="rgba(0,0,0,0.13)"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M 135 26 L 135 100"
                      fill="none"
                      stroke="rgba(0,0,0,0.07)"
                      strokeWidth="1.2"
                    />
                  </>
                )}
                <rect
                  x="22"
                  y="6"
                  width="226"
                  height="21"
                  rx="3"
                  fill={col.bandHex}
                  stroke="rgba(0,0,0,0.10)"
                  strokeWidth="1"
                />
                <text
                  x="56"
                  y="20"
                  fill={col.textHex}
                  fontSize="9.5"
                  fontWeight="700"
                  letterSpacing="1.2"
                >
                  {brandLabel}
                </text>
                <text
                  x="135"
                  y="20"
                  textAnchor="middle"
                  fill={col.textHex}
                  fontSize="9.5"
                  fontWeight="700"
                  letterSpacing="1.2"
                >
                  {brandLabel}
                </text>
                <text
                  x="214"
                  y="20"
                  textAnchor="end"
                  fill={col.textHex}
                  fontSize="9.5"
                  fontWeight="700"
                  letterSpacing="1.2"
                >
                  {brandLabel}
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
}

export function TechnicalFlatDrawingSvg() {
  return (
    <svg viewBox="0 0 420 155" className="w-full h-[145px]">
      <g transform="translate(12, 10)">
        <path
          d="M 18 18 L 166 18 L 178 116 L 114 122 L 99 96 L 85 96 L 70 122 L 6 116 Z"
          fill="#FFFFFF"
          stroke="#2C2C2E"
          strokeWidth="1.6"
        />
        <line x1="17" y1="33" x2="167" y2="33" stroke="#2C2C2E" strokeWidth="1.4" />
        <path
          d="M 68 33 C 66 68, 74 92, 92 96 C 110 92, 118 68, 116 33"
          fill="none"
          stroke="#2C2C2E"
          strokeWidth="1.3"
        />
        <line
          x1="92"
          y1="33"
          x2="92"
          y2="96"
          stroke="#8E8E93"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <line
          x1="8"
          y1="109"
          x2="71"
          y2="115"
          stroke="#8E8E93"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <line
          x1="113"
          y1="115"
          x2="176"
          y2="109"
          stroke="#8E8E93"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <text x="92" y="138" textAnchor="middle" fontSize="10" fill="#6E6E73">
          Вид спереди (3D панель, ≈25 см)
        </text>
      </g>

      <g transform="translate(222, 10)">
        <path
          d="M 18 18 L 166 18 L 178 116 L 114 122 L 99 96 L 85 96 L 70 122 L 6 116 Z"
          fill="#FFFFFF"
          stroke="#2C2C2E"
          strokeWidth="1.6"
        />
        <line x1="17" y1="33" x2="167" y2="33" stroke="#2C2C2E" strokeWidth="1.4" />
        <path
          d="M 74 96 Q 92 84 110 96"
          fill="none"
          stroke="#2C2C2E"
          strokeWidth="1.2"
        />
        <line
          x1="8"
          y1="109"
          x2="71"
          y2="115"
          stroke="#8E8E93"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <line
          x1="113"
          y1="115"
          x2="176"
          y2="109"
          stroke="#8E8E93"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <text x="92" y="138" textAnchor="middle" fontSize="10" fill="#6E6E73">
          Вид сзади (без среднего шва)
        </text>
      </g>
    </svg>
  );
}
