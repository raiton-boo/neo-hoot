# 📚 ドキュメント一覧 (neo-hoot)

neo-hootの設計・仕様・開発ルールをまとめたドキュメント群です。実装前の計画フェーズで作成したものが中心で、実装中も随時更新します。

## 読む順番の目安

はじめてこのプロジェクトに触れる場合は、以下の順に読むと全体像を掴みやすいです。

1. [`spec.md`](./spec.md) — 何を作るか（機能仕様）
2. [`er.md`](./er.md) — データ構造（ER図・フィールドごとの制約）
3. [`architecture.md`](./architecture.md) — どう組み立てるか（システム構成・通信方式・非同期ジョブ）
4. [`design.md`](./design.md) — 見た目のルール（デザインシステム）
5. [`wireframes/`](./wireframes/) — 画面ごとの具体的なワイヤーフレームと個別の設計判断

## ドキュメント一覧

| ドキュメント                                         | 内容                                                                                                 |
| :--------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| [`setup.md`](./setup.md)                             | ローカル開発環境の詳しいセットアップ手順・環境変数の説明                                             |
| [`commands.md`](./commands.md)                       | pnpm・Docker・Next.js CLI・NestJS CLI等のよく使うコマンド集                                          |
| [`spec.md`](./spec.md)                               | 機能仕様書。サービス概要、ユーザー種別、出題形式、採点方式、ゲーム進行フロー、バリデーション項目など |
| [`er.md`](./er.md)                                   | ER図（Mermaid）とフィールドごとの制約。`packages/db`のDrizzleスキーマの元になる                      |
| [`architecture.md`](./architecture.md)               | システム構成図、REST/WebSocketの使い分け、シーケンス図、BullMQの使いどころ、認証フロー               |
| [`design.md`](./design.md)                           | デザインシステム。ネオブルータリズムの方向性、配色、タイポグラフィ、コンポーネントの基本ルール       |
| [`wireframes/`](./wireframes/)                       | 画面ごとのHTMLワイヤーフレームと、対応する`.md`（個別の設計判断・修正の経緯）                        |
| [`rules/git-workflow.md`](./rules/git-workflow.md)   | Git運用ルール（ブランチ戦略・コミット規約・PR規約）                                                  |
| [`rules/coding-style.md`](./rules/coding-style.md)   | コーディング規約（Linter/Formatter設定など）                                                         |
| [`rules/ai-guidelines.md`](./rules/ai-guidelines.md) | AIとの協働ルール（権限範囲・進行ルール）                                                             |

## ワイヤーフレームの構成

`wireframes/host/` と `wireframes/participant/` に、それぞれホスト側・参加者側の画面のHTMLファイルが置かれています。指摘・変更が入った画面には、同じ場所に同名の`.md`ファイルがあり、その画面固有の設計判断や修正の経緯を記録しています（`design.md`の11節に一覧あり）。

`wireframes/shared.css` は全画面共通のスタイル（配色変数・ボタン・カード等のコンポーネント）です。
