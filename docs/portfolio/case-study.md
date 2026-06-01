---
title: '民泊予約・運営管理システム 制作事例（サンプル）'
description: 'Next.js 15 + TypeScript で構築した一棟貸し民泊向けの予約・運営管理システム。Stripe manual capture、RemoteLOCK 連携、Airbnb iCal 同期、住宅宿泊事業法対応UIを実装したサンプル案件。'
keywords:
  - 民泊予約システム 開発
  - 一棟貸し 管理システム
  - RemoteLOCK 連携
  - Airbnb iCal 連携
  - 住宅宿泊事業法対応
  - Stripe 与信
date: 2026-05-30
---

# 民泊予約・運営管理システム 制作事例

> 本事例は OceansBase が公開している
> [`oceans-minpaku-demo`](https://github.com/OceansCreative/oceans-minpaku-demo)
> をベースに記述しています。実在の案件ではなく架空設定のサンプルです。

## 案件概要（架空想定）

- **クライアント**: 山陰地方で 4 室の一棟貸し民泊を運営する個人事業主（架空）
- **施設**: 和庵 山陰（Wa-an San'in）／一棟貸し、4 室、駐車場 10 台
- **課題感**:
  - Airbnb / 自社サイトの両方で予約を受けるとダブルブッキングが起きる
  - 鍵の受け渡しが対面で運用負担が高い
  - 民泊新法（住宅宿泊事業法）の宿泊者名簿対応が手動 Excel
- **ゴール**: 1 つの管理画面で全予約を集約しつつ、決済 / 鍵 / 法令対応まで一気通貫で回せる状態

## 採用技術

| 領域         | 採用                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------- |
| フロント     | Next.js 15 (App Router) / TypeScript（strict） / Tailwind CSS                                 |
| 状態管理     | Zustand（`persist` で localStorage 永続化、ゲスト⇄管理で同一ストア共有）                      |
| グラフ       | Recharts                                                                                      |
| カレンダー   | react-day-picker（ゲスト側）／自前テーブル（管理側）                                          |
| i18n         | next-intl（ja / en フル、zh / ko は約 34% のスキャフォールド）                                |
| 外部連携     | Stripe Payment Intents（manual capture）、RemoteLOCK Connect API、Airbnb Calendar iCal export |
| テスト       | Vitest + Testing Library（37 ユニットテスト・3 タイムゾーン CI マトリクス）                   |
| CI           | GitHub Actions（format / lint / typecheck / test / build）                                    |
| ホスティング | Vercel                                                                                        |

## 実装機能

### ゲスト側

- 施設トップ + 部屋一覧 + 部屋詳細
- 予約フロー（カレンダー → 時刻 → 駐車場 → 料金（動的）→ ゲスト情報 → 決済モック → リクエスト送信）
- 予約ステータス画面（承認待ち → 確定 → スマートロックパスコード表示）
- 多言語切替（ja / en フル、zh / ko 部分）

### 管理側

- モック認証ログイン（demo / demo）
- ダッシュボード（本日チェックイン/アウト / 稼働率 / 月次売上 / 180 日カウンタ）
- 予約管理（ステータス・経路フィルタ、承認 / 却下 / キャンセル）
- カレンダー（部屋 × 日付グリッド、経路色分け、ダブルブッキング警告）
- ゲストメッセージ（スレッド型UI）
- リマインダーテンプレート CRUD
- 売上集計（日 / 月 / 年 / 期間指定、Recharts 積み上げ棒グラフ）
- パスコード管理（発行履歴 / 再発行 / 失効）
- 料金設定（ダイナミックプライシングルール CRUD）
- キャンセル設定（ステップ型ポリシー）
- OTA 連携（Airbnb iCal URL 設定 / Booking.com / Agoda 拡張枠）
- 宿泊者名簿（住宅宿泊事業法対応、ICT本人確認、CSV エクスポート）
- サンプルデータリセット

## 設計上の工夫

### 1. ダブルブッキング防止は多層防御

- 自社サイトの予約は提出時に在庫を排他チェック
- Airbnb iCal は上流で 2〜4 時間の遅延があるため、承認時にも `detectOverlap`
  を走らせ、重複があれば赤い警告で承認をブロック
- `detectOverlap` は純粋関数として切り出し、ユニットテスト 12 本でエッジケース
  （隣接ステイ・キャンセル/却下の扱い・自己重複の除外）をカバー
- 承認ガード自体にも 4 本の独立したテストを置き、CI はその全てを
  **UTC / Asia/Tokyo / America/New_York の 3 タイムゾーン**で並行に回す
  ことで、`getDay()` 系の時差バグが将来再発しないよう仕掛けを残している

### 2. Stripe manual capture でホストの判断を待つ

- ゲスト予約時は `createPaymentIntent` で与信のみ確保（authorized）
- ホスト承認時に `capturePaymentIntent` で正式決済（captured）
- 却下時は `cancelPaymentIntent` で与信解除（released）
- キャンセル時は `refundPaymentIntent` の partial refund でデポジット差引

### 3. RemoteLOCK は最小限のラッパー

- `issueCode` / `reissueCode` / `revokeCode` の 3 操作のみに集約
- 滞在期間のみ有効な 6 桁コードを承認時に自動発行、キャンセル時に失効
- 本番では `lib/mock/remotelock.ts` を実 API クライアントに差し替えるだけで切替え可能

### 4. モック層を 1 ディレクトリに集約

- `lib/mock/{stripe,remotelock,airbnb-ical}.ts` のヘッダーに
  `// ===== MOCK: 本番では実API（◯◯）に差し替え =====` を統一表記
- UI / Service 層は外部 API を直接 import しない
- 「サンプル → 本番」のスイッチが grep 一発で見えるので、商談時の説明工数が減る

### 5. 住宅宿泊事業法対応を最初から組み込む

- 宿泊者名簿（§8）の必須項目を予約フローと宿泊者名簿ページの両方で吸い上げ
- ICT本人確認（§6）を意識した身分証アップロード UI
- 年間 180 日上限（§2-3）はダッシュボードに常設カウンタ

## OceansBase の提供範囲

| フェーズ           | 内容                                                                              |
| ------------------ | --------------------------------------------------------------------------------- |
| 要件定義 / UX 設計 | ユースケース整理、画面遷移設計、ロール分け                                        |
| プロトタイプ       | 本サンプルの主要画面を起点としたカスタマイズプロトタイプ                          |
| 実装               | Next.js + TypeScript フロント、Stripe / RemoteLOCK / OTA 連携、CI / IaC 整備      |
| 法令対応           | 宿泊者名簿・本人確認・180日上限などの実装、所轄保健所への届出文書テンプレート整備 |
| 運用支援           | デプロイ、監視（Sentry / Datadog 連携）、保守契約                                 |

## ご相談

このシステムの一部または全部をベースに、お客様の宿泊事業向けにカスタマイズ可能です。
ご相談は [oceans-base.com/contact](https://oceans-base.com/contact) から。

---

_Source: <https://github.com/OceansCreative/oceans-minpaku-demo>_
