# 💻 コーディング規約 (neo-hoot)

本ドキュメントは `~/dev/rules/CODING-STYLE.md` の言語非依存な基本方針をベースに、
neo-hoot固有の技術スタック（TypeScriptモノレポ / Next.js / NestJS / Tailwind v4 / Drizzle）に合わせて具体化したものです。
フォーマットなど「機械が判断できること」はツールに任せ、人間（とAI）は「設計と意図」に集中する。

## 1. 基本方針（`~/dev/rules`を継承）

- **明確さを優先**: 短さよりも「何をするものか」が正確に伝わる英単語を選ぶ（例: `d`ではなく`userData`）。
- **真偽値**: `is` `has` `should` `can` などの接頭辞をつける（例: `isVisible`, `hasError`）。
- **関数名**: 実行する処理がわかるように「動詞」から始める（例: `getUser`, `calculateTotal`）。
- **早期リターン**: ネストを浅く保つため、異常系・条件を満たさない場合は関数冒頭で`return`する。
- **マジックナンバー禁止**: 意味のある数値・文字列は定数として名前を与える。
- **単一責任の原則（SRP）**: 1関数・1ファイルは1つの役割だけを持つ。
- **コメントは「なぜ」を重視**: 読めば自明な処理（What）は書かず、アプローチを選んだ理由（Why）を書く。
- **エラーの握りつぶし禁止**: 空の`catch`でエラーを隠蔽しない。必要に応じて呼び出し元へ伝播させる。
- **`any`の原則禁止**: 型安全性を損なう`any`は使わない（詳細は3節）。
- **機密情報のハードコード禁止**: APIキー等は必ず環境変数（`.env`）経由で読み込む。

---

## 2. Lint / Formatter

### ツール: ESLint + Prettier

- 業界標準の組み合わせを採用。Next.js公式テンプレート・NestJS CLIの初期設定と親和性が高い。
- Tailwind v4のクラス順序は `prettier-plugin-tailwindcss` で自動整形する（手動でクラス順を意識しなくてよい）。
- Linterのエラー・警告は**原則すべて解消してからコミット**する。やむを得ずルールを無効化する場合は、必ずコメントで理由を明記する。

### モノレポの共通設定

Turborepoのベストプラクティスに従い、設定を一元管理する共有パッケージを作成する。

```
packages/
  eslint-config/       # 共有ESLint設定（base / next / nest の3種を用意）
  typescript-config/   # 共有tsconfig（base.json / nextjs.json / nestjs.json）
```

- `apps/web`（Next.js）、`apps/api`（NestJS）はそれぞれ対応する設定を`extends`する。
- 各アプリ固有のルールが必要な場合のみ、アプリ側の設定ファイルで上書きする。

---

## 3. TypeScript

- **`strict: true`必須**。`any`型（および暗黙的な`any`）は原則禁止とし、`unknown`＋型ガードで対応する。
- **`type` vs `interface`**: 基本は`type`を使う。Reactコンポーネントの`Props`定義のみ`interface`を許可する（宣言の拡張がしやすいため）。
- **境界の型定義**: APIレスポンスやSocketイベントのペイロードなど、外部とのやり取りが発生する箇所は明示的に型を定義する。これらは`packages/types`（共有型パッケージ）に集約し、フロント/バック両方から参照する。
- **パスエイリアス**: 各アプリ内は`@/*`でsrc相対を解決する。パッケージ間の参照はモノレポのワークスペース参照（`@neo-hoot/types`など）を使い、相対パスで`../../packages/...`のように辿らない。

---

## 4. 命名規則

| 対象                        | 規則                     | 例                                                        |
| :-------------------------- | :----------------------- | :-------------------------------------------------------- |
| Reactコンポーネントファイル | `PascalCase.tsx`         | `QuizCard.tsx`                                            |
| それ以外のファイル          | `kebab-case.ts`          | `quiz-service.ts`, `use-socket.ts`                        |
| 変数・関数                  | `camelCase`              | `getUserById`                                             |
| 型・インターフェース        | `PascalCase`             | `QuizRoom`, `type SocketPayload`                          |
| 定数（マジックナンバー等）  | `UPPER_SNAKE_CASE`       | `MAX_PLAYERS_PER_ROOM`                                    |
| NestJSのモジュール構成      | Nest CLI標準の命名に従う | `quiz.controller.ts`, `quiz.service.ts`, `quiz.module.ts` |

---

## 5. テストの配置

テストの種類によって配置を使い分ける。

### 単体・結合テスト（Vitest）→ コロケーション

```
apps/api/src/quiz/
  quiz.service.ts
  quiz.service.spec.ts   ← 実装の隣に置く
```

- NestJS CLIのデフォルト（`*.spec.ts`を隣に生成）、Next.js/React + Vitestの主流パターンに合わせる。
- 実装ファイルとテストの対応関係が一目でわかり、ファイル移動時もテストが一緒についてくる。

### E2Eテスト（Playwright）→ 専用ディレクトリ

```
apps/web/
  e2e/
    quiz-flow.spec.ts   ← ユーザーフロー全体を検証するため、単一の実装ファイルに対応しない
```

- クイズ作成→参加→回答のような複数画面をまたぐフローを検証するテストは、特定のソースファイルに紐づかないため、`e2e/`に集約する。

### DBに依存するテスト

`QuizService`のように実際にDBへ問い合わせるServiceは、モックに差し替えず、実際のPostgreSQLに対してテストする（結合テストに近い形）。本番/開発用のデータと混ざらないよう、専用のテスト用データベース（`neohoot_test`、`docs/setup.md`参照）に接続する。

---

## 6. フレームワーク固有の方針（詳細は環境構築フェーズで決定）

- **Next.js (App Router)**: ルーティングは`app/`ディレクトリ規約に従う。Server Component/Client Componentの使い分けは、実装時に都度解説する。
- **NestJS**: 機能ごとにModule/Controller/Serviceを分割する（フィーチャーモジュール構成）。
- **Drizzle ORM**: スキーマ定義は`packages/db`（または`apps/api/src/db`）に集約し、マイグレーションファイルはコミットに含める。
