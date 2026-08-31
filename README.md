# neo-hoot

Kahoot!風のリアルタイム・クイズ＆アンケートプラットフォーム。学習・ポートフォリオ用途で開発している個人プロジェクトです。

ホストが作成したクイズを使ってライブセッションを開催し、参加者がスマートフォンからリアルタイムに回答します。採点はKahoot式（正解＋回答速度）で、4択・○×・アンケートの3形式の設問を1つのクイズに混在させられます。

## 技術スタック

| 領域               | 技術                                                    |
| :----------------- | :------------------------------------------------------ |
| モノレポ           | pnpm workspaces + Turborepo                             |
| フロントエンド     | Next.js (App Router) / React / Tailwind CSS v4 / Motion |
| バックエンド       | NestJS / Socket.io / BullMQ                             |
| データベース       | PostgreSQL + Drizzle ORM                                |
| キャッシュ・キュー | Redis                                                   |
| 認証               | OAuth (Google / GitHub)                                 |
| テスト             | Vitest / Playwright                                     |
| ローカル開発環境   | Docker (NestJS, PostgreSQL, Redis)                      |

本番デプロイは行わず、ローカル開発環境のみを対象とします。

## ディレクトリ構成

```
apps/
  web/      Next.js フロントエンド
  api/      NestJS バックエンド
packages/
  typescript-config/   共有TypeScript設定
  eslint-config/       共有ESLint設定
  db/                  Drizzleスキーマ・DBクライアント（実装予定）
docs/
  設計・仕様ドキュメント一式（詳細は docs/README.md を参照）
```

## セットアップ

```bash
mise install && pnpm install && cp .env.example .env && docker compose up
```

詳しい手順・環境変数の説明は[`docs/setup.md`](./docs/setup.md)を参照してください。

## よく使うコマンド

pnpm・Docker・Next.js CLI・NestJS CLIなど、開発中によく使うコマンドは[`docs/commands.md`](./docs/commands.md)にまとめています。

## ドキュメント

設計・仕様・開発ルールなどのドキュメントは [`docs/`](./docs/) 配下にまとまっています。詳しくは [`docs/README.md`](./docs/README.md) を参照してください。
