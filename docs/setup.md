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

| 変数名              | 用途                                                                                                                                    |
| :------------------ | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `POSTGRES_USER`     | PostgreSQLの接続ユーザー名                                                                                                              |
| `POSTGRES_PASSWORD` | PostgreSQLの接続パスワード                                                                                                              |
| `POSTGRES_DB`       | 作成するデータベース名                                                                                                                  |
| `POSTGRES_TEST_DB`  | テスト実行用の専用データベース名（開発用データと混ざらないよう分離する。作成手順は下記「テスト用データベースの準備」参照）              |
| `POSTGRES_PORT`     | ホスト側に公開するPostgreSQLのポート（デフォルト5432）                                                                                  |
| `POSTGRES_HOST`     | PostgreSQLの接続先ホスト名（デフォルト`localhost`。Dockerコンテナ内(`apps/api`)からは`docker-compose.yml`側で`postgres`に上書きされる） |
| `REDIS_PORT`        | ホスト側に公開するRedisのポート（デフォルト6379）                                                                                       |
| `API_PORT`          | ホスト側に公開するNestJS(api)のポート（デフォルト3001）                                                                                 |
| `JWT_SECRET`        | ログインセッションを表すJWTの署名鍵。推測されにくいランダムな文字列にする                                                               |
| `WEB_URL`           | OAuthログイン成功後にリダイレクトするフロントエンドのURL（デフォルト`http://localhost:3000`）                                           |

ローカル開発専用の値のため、`.env`の中身は空のパスワード等でも動作する（`coding-style.md`の機密情報の方針も参照）。

### 4. バックエンド一式の起動（Docker）

```bash
docker compose up
```

`postgres` / `redis` / `api`（NestJS）の3つのコンテナが起動する。`api`は`nest start --watch --builder swc`によりホットリロードされる（コード変更が即座に反映される）。

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

## ngrokで外部公開する（同一LAN外からの参加テスト用）

同じWi-Fi内にいない相手にルームへ参加してもらう場合や、実機のQRコード読み取りを別ネットワークから試したい場合は、[ngrok](https://ngrok.com/)でローカルの開発サーバーを外部公開できる。

### 前提

- `ngrok`コマンドがインストール済みであること（例: `brew install ngrok`）
- ngrokアカウントでの認証済みであること（初回のみ）

```bash
ngrok config add-authtoken <ngrokダッシュボードで発行したトークン>
```

### 起動

```bash
pnpm run ngrok
```

`apps/web`（ポート3000）を外部公開する。あらかじめ`pnpm --filter web dev`でフロントエンドを起動しておくこと。起動後にターミナルへ表示される`https://xxxx.ngrok-free.app`のようなURLを、参加者側の共有先として使う。

現状は`apps/web`のみを公開する想定で、`apps/api`（Socket.io）を含めた外部公開は未検証（TODO）。

## テスト用データベースの準備

`apps/api`のVitestテスト（DBに依存するもの）は、開発用の`neohoot`データベースとは別の`neohoot_test`に接続する（`docs/rules/coding-style.md`の「DBに依存するテスト」参照）。同じPostgreSQLコンテナの中に、空のデータベースを1つ追加で作る（初回のみ）。

```bash
docker exec neo-hoot-postgres-1 createdb -U neohoot neohoot_test
```

作成したら、`neohoot_test`にも通常のマイグレーションを適用する。`POSTGRES_DB`を一時的に上書きして実行する。

```bash
POSTGRES_DB=neohoot_test pnpm --filter @neo-hoot/db db:migrate
```

スキーマを変更した際は、`neohoot`と`neohoot_test`の両方にマイグレーションを適用し忘れないよう注意する。

## 終了・後片付け

```bash
# コンテナを停止（データは保持される）
docker compose down

# コンテナ停止 + ボリューム（DBデータ）も削除
docker compose down -v
```
