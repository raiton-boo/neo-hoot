# 🔧 セットアップ手順 (neo-hoot)

ローカル開発環境の詳しいセットアップ手順です。クイックスタートは[README.md](../README.md)を参照してください。

## 前提ツール

| ツール                        | 用途                                                   |
| :---------------------------- | :----------------------------------------------------- |
| [mise](https://mise.jdx.dev/) | pnpmのバージョン管理（`mise.toml`でバージョンを固定）  |
| Docker / Docker Compose       | PostgreSQL・Redis・NestJS(api)をコンテナで起動するため |

## 手順

### 1. ツールのインストール

```bash
mise install
```

`mise.toml`に記載されたバージョンのpnpmが導入される。

### 2. 依存パッケージのインストール

```bash
pnpm install
```

モノレポ全体（`apps/*`, `packages/*`）の依存関係を一括インストールする。

### 3. 環境変数ファイルの用意

```bash
cp .env.example .env
```

| 変数名              | 用途                                                    |
| :------------------ | :------------------------------------------------------ |
| `POSTGRES_USER`     | PostgreSQLの接続ユーザー名                              |
| `POSTGRES_PASSWORD` | PostgreSQLの接続パスワード                              |
| `POSTGRES_DB`       | 作成するデータベース名                                  |
| `POSTGRES_PORT`     | ホスト側に公開するPostgreSQLのポート（デフォルト5432）  |
| `REDIS_PORT`        | ホスト側に公開するRedisのポート（デフォルト6379）       |
| `API_PORT`          | ホスト側に公開するNestJS(api)のポート（デフォルト3001） |

ローカル開発専用の値のため、`.env`の中身は空のパスワード等でも動作する（`coding-style.md`の機密情報の方針も参照）。

### 4. バックエンド一式の起動（Docker）

```bash
docker compose up
```

`postgres` / `redis` / `api`（NestJS）の3つのコンテナが起動する。`api`は`apps/api/nodemon.json`によりホットリロードされる（コード変更が即座に反映される）。

### 5. フロントエンドの起動

```bash
pnpm --filter web dev
```

`apps/web`（Next.js）は現状Docker化しておらず、ホストマシン上で直接起動する。

### 6. アクセス確認

| サービス            | URL                                             |
| :------------------ | :---------------------------------------------- |
| フロントエンド(web) | http://localhost:3000                           |
| バックエンド(api)   | http://localhost:{`API_PORT`}（デフォルト3001） |

スマートフォンの実機で参加者側画面を確認する場合は、`localhost`ではなく`127.0.0.1:3000`、またはPCのLAN内IPアドレスでアクセスする（同一Wi-Fi内であれば）。

## 終了・後片付け

```bash
# コンテナを停止（データは保持される）
docker compose down

# コンテナ停止 + ボリューム（DBデータ）も削除
docker compose down -v
```
