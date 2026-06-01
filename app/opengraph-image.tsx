import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = '和庵 山陰 — Sample minpaku booking & operations system, built by OceansBase';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Programmatically generated social-preview image. Renders at build time via
 * @vercel/og so we don't ship a bitmap. Shown on GitHub's repository card,
 * Twitter / X, LinkedIn, Slack unfurls, etc.
 *
 * SPEC §1.1 specifies a 1280×640 hero. 1200×630 is the canonical OG dimension
 * that every consumer scales to — close enough and works everywhere.
 */
export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #1f2024 0%, #2d2a26 60%, #5b6b4a 100%)',
        color: '#f6f1e7',
        fontFamily: 'sans-serif',
        padding: '64px 80px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            width: 14,
            height: 14,
            background: '#9b2335',
            borderRadius: 999,
          }}
        />
        <span
          style={{
            fontSize: 18,
            letterSpacing: 8,
            textTransform: 'uppercase',
            color: 'rgba(246,241,231,0.7)',
          }}
        >
          OceansBase / Sample
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <h1
          style={{
            fontSize: 96,
            lineHeight: 1.05,
            margin: 0,
            fontWeight: 500,
            letterSpacing: -1,
          }}
        >
          和庵 山陰
        </h1>
        <p
          style={{
            fontSize: 30,
            lineHeight: 1.4,
            margin: 0,
            color: 'rgba(246,241,231,0.85)',
            maxWidth: 900,
          }}
        >
          民泊予約・運営管理システム — 承認制フロー、ダブルブッキング防止、
          スマートロック・OTA連携の制作サンプル
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          borderTop: '1px solid rgba(246,241,231,0.18)',
          paddingTop: 22,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26, color: '#f6f1e7', fontWeight: 600, letterSpacing: 1 }}>
            Live demo
          </span>
          <span style={{ fontSize: 26, color: '#5b6b4a' }}>→</span>
          <span
            style={{
              fontSize: 24,
              color: 'rgba(246,241,231,0.85)',
              fontFamily: 'monospace',
            }}
          >
            minpaku-demo.oceans-base.com
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <span style={{ fontSize: 20, color: 'rgba(246,241,231,0.55)' }}>
            Next.js 15 · TypeScript · Stripe · RemoteLOCK · Airbnb iCal
          </span>
          <span style={{ fontSize: 20, color: '#f6f1e7' }}>oceans-base.com</span>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
