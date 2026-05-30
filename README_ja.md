# Oceans Minpaku Demo（日本語版）

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![CI](https://github.com/OceansCreative/oceans-minpaku-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/OceansCreative/oceans-minpaku-demo/actions/workflows/ci.yml)

> 民泊（一棟貸し）の予約 & 運営管理システムのサンプル。承認制フロー、ダブルブッキング防止、
> スマートロック (RemoteLOCK) 連携、OTA (Airbnb iCal) 同期パターンを実装。
> [OceansBase](https://oceans-base.com) の制作サンプルとして公開しています。

## デモサイト

**[minpaku-demo.oceans-base.com](https://minpaku-demo.oceans-base.com)**

ゲスト側は認証不要。管理側は `demo` / `demo` でログインできます。

## 主な特徴

- **承認制の予約フロー**: ゲスト予約時は Stripe で与信のみ確保（authorized）、
  ホスト承認時に正式に決済（captured）。
- **ダブルブッキング防止**: 承認時に在庫を再チェックし、競合があれば赤い警告で承認をブロック。
- **スマートロック (RemoteLOCK)**: 滞在期間のみ有効な 6 桁パスコードを承認時に発行、
  キャンセル時に失効。
- **OTA (Airbnb iCal) 同期**: 上流の 2〜4 時間遅延を明示し、承認制を最終防波堤として設計。
- **住宅宿泊事業法対応**: 宿泊者名簿（氏名・国籍・職業・3年保存）、ICT本人確認、
  年間180日稼働カウンタ。
- **多言語対応**: 日本語・英語フル、中国語・韓国語は部分対応。

## 技術スタック

- Next.js 15 (App Router) + TypeScript (strict)
- Tailwind CSS
- Zustand (`persist` で localStorage 永続化、ゲスト⇄管理で同一ストア共有)
- Recharts（売上集計）
- next-intl（i18n）
- Vitest + Testing Library（27 ユニットテスト）
- ESLint / Prettier / husky / lint-staged
- GitHub Actions CI（format / lint / typecheck / test / build）

## クイックスタート

```bash
npm install
npm run dev
```

- ゲスト: <http://localhost:3000>
- 管理: <http://localhost:3000/admin>（`demo` / `demo`）

## 体験シナリオ

1. `/rooms` で 月の間 を選んで「このお部屋を予約する」
2. 日程 → 時刻 → 駐車場 → 料金 → ゲスト情報 → モック決済 → 送信
3. 予約ステータスは `pending`（承認待ち）
4. `/admin/login` で `demo` / `demo` でログイン
5. 予約管理から先ほどの予約を承認 → Stripe capture + RemoteLOCK パスコード発行
6. カレンダーから `res-overlap-direct` を開き、ダブルブッキング警告でブロックされることを確認
7. 承認済み予約をキャンセル → キャンセルポリシーに基づき返金額が算出される

## 設計判断（要点）

- **ダブルブッキング防止は多層防御**。直販予約は提出時に在庫を確定、Airbnb 経由は iCal 遅延があるため
  承認時に再チェック。`detectOverlap` は純粋関数で 12 のユニットテストでカバー。
- **Stripe manual capture** は「ホストが審査してから決済する」という運用感覚に最も合う方式。
- **RemoteLOCK** は滞在期間のみ有効・回転可・失効可。モック層は `issueCode` / `reissueCode` /
  `revokeCode` の 3 操作のみに絞り、本番では一ファイル差し替えで切替え可能。
- **Zustand + persist 単一ストア**: ブラウザ完結なので、管理側で承認した瞬間にゲスト側のステータスも
  即更新される。

## 免責

これは OceansBase が公開する制作サンプルです。Stripe / RemoteLOCK / Airbnb の連携は
**すべてモック**で、実際の決済・解錠・OTA通信は発生しません。本番運用には追加の実装・契約・
法令対応が必要です。詳細は [NOTICE](./NOTICE) を参照してください。

## OceansBase について

[OceansBase](https://oceans-base.com) は日本の宿泊・観光業界向けに業務システムの設計・開発を
行っています。同様のシステムをご検討の方は[お問い合わせ](https://oceans-base.com/contact)から
ご相談ください。

## ライセンス

Apache License 2.0
