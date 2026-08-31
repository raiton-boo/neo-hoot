# ⌨️ よく使うコマンド集 (neo-hoot)

開発中によく使うコマンドをまとめたチートシート。新しいツール（Drizzle CLI等）を導入したら随時追記する。

## pnpm / モノレポ操作

| コマンド                                                | 内容                                                                    |
| :------------------------------------------------------ | :---------------------------------------------------------------------- |
| `pnpm install`                                          | モノレポ全体の依存関係をインストール                                    |
| `pnpm dev` / `build` / `lint` / `test`                  | ルートから実行すると、Turborepo経由で全ワークスペースに対して実行される |
| `pnpm --filter web <script>`                            | `apps/web`だけを対象にスクリプトを実行（例: `pnpm --filter web dev`）   |
| `pnpm --filter api <script>`                            | `apps/api`だけを対象にスクリプトを実行（例: `pnpm --filter api test`）  |
| `pnpm add <パッケージ名> --filter web`                  | `apps/web`にだけ依存パッケージを追加                                    |
| `pnpm add <パッケージ名> -w`                            | ルート（モノレポ全体で共有する開発ツール等）に依存パッケージを追加      |
| `pnpm add <パッケージ名> --filter web -F @neo-hoot/xxx` | ワークスペース内の別パッケージ(`workspace:*`)への依存を追加             |

## Docker

| コマンド                     | 内容                                                       |
| :--------------------------- | :--------------------------------------------------------- |
| `docker compose up`          | 全コンテナをフォアグラウンドで起動（ログがそのまま流れる） |
| `docker compose up -d`       | 全コンテナをバックグラウンドで起動                         |
| `docker compose down`        | 全コンテナを停止・削除（ボリュームは残る）                 |
| `docker compose down -v`     | 停止・削除に加えてボリューム（DBデータ等）も削除           |
| `docker compose logs -f api` | `api`コンテナのログをリアルタイムで確認                    |
| `docker compose restart api` | `api`コンテナだけ再起動                                    |
| `docker compose exec api sh` | `api`コンテナの中に入ってシェル操作                        |

## Next.js CLI（`apps/web`）

| コマンド                  | 内容                            |
| :------------------------ | :------------------------------ |
| `pnpm --filter web dev`   | 開発サーバーを起動（Turbopack） |
| `pnpm --filter web build` | 本番用ビルド                    |
| `pnpm --filter web start` | ビルド済みのアプリを起動        |
| `pnpm --filter web lint`  | ESLintを実行                    |

## NestJS CLI（`apps/api`）

コード生成系のコマンドは`apps/api`ディレクトリの中で実行する（`nest-cli.json`を参照するため）。

```bash
cd apps/api
```

| コマンド                             | 内容                                                                     |
| :----------------------------------- | :----------------------------------------------------------------------- |
| `pnpm exec nest g module <name>`     | モジュールを生成                                                         |
| `pnpm exec nest g controller <name>` | コントローラーを生成（テストファイルも同時生成）                         |
| `pnpm exec nest g service <name>`    | サービスを生成（テストファイルも同時生成）                               |
| `pnpm exec nest g resource <name>`   | モジュール+コントローラー+サービス+DTOをまとめて生成（CRUD一式のひな形） |
| `pnpm --filter api test`             | Vitestでユニットテストを実行                                             |
| `pnpm --filter api test:watch`       | Vitestをウォッチモードで実行                                             |
| `pnpm --filter api test:e2e`         | E2Eテストを実行（`test/**/*.e2e-spec.ts`）                               |
| `pnpm --filter api build`            | 本番用ビルド（`nest build`）                                             |
| `pnpm --filter api lint`             | ESLintを実行（`--fix`付き）                                              |

`nest g`はインタラクティブに「どこに生成するか」を聞いてくることがある。基本は`src/`配下にそのまま生成すればよい。

## Drizzle CLI（`packages/db`）

`packages/db`のスキーマ実装後、マイグレーション生成・適用等のコマンドをここに追記する（現時点では未実装）。
