# 🗂️ ER図 (neo-hoot)

`docs/spec.md`の機能仕様から導き出したエンティティとその関係。実装時の`packages/db`のDrizzleスキーマは、このER図を元に作成する。

## エンティティ関係図

```mermaid
erDiagram
    USER ||--o{ QUIZ : "作成する"
    QUIZ ||--|{ QUESTION : "含む"
    QUESTION ||--|{ CHOICE : "選択肢を持つ"
    QUIZ ||--o{ GAME_SESSION : "開催される"
    GAME_SESSION ||--o{ PARTICIPANT : "参加する"
    GAME_SESSION ||--o{ ANSWER : "回答が記録される"
    PARTICIPANT ||--o{ ANSWER : "回答する"
    QUESTION ||--o{ ANSWER : "対象になる"
    CHOICE ||--o{ ANSWER : "選ばれる"

    USER {
        uuid id PK
        string email
        string name
        string oauth_provider
        string oauth_id
        timestamp created_at
    }

    QUIZ {
        uuid id PK
        uuid user_id FK
        string title
        string description
        timestamp created_at
        timestamp updated_at
    }

    QUESTION {
        uuid id PK
        uuid quiz_id FK
        string type "choice / true_false / survey"
        string body
        int time_limit_seconds
        int order
    }

    CHOICE {
        uuid id PK
        uuid question_id FK
        string body
        boolean is_correct
        int order
    }

    GAME_SESSION {
        uuid id PK
        uuid quiz_id FK
        string room_code
        string status "waiting / in_progress / finished"
        timestamp started_at
        timestamp finished_at
    }

    PARTICIPANT {
        uuid id PK
        uuid game_session_id FK
        string nickname
        timestamp joined_at
    }

    ANSWER {
        uuid id PK
        uuid game_session_id FK
        uuid participant_id FK
        uuid question_id FK
        uuid choice_id FK
        int response_time_ms
        int score
        timestamp answered_at
    }
```

## 補足

- **QUIZ ↔ GAME_SESSION**: 1つのクイズ（テンプレート）から、何度でもゲームセッション（開催）を作れる1対多の関係（`spec.md`の「データの2層構造」に対応）。
- **PARTICIPANT**: `USER`とは無関係の独立したエンティティ。アカウント不要の参加者を表す。
- **ANSWER**: 「誰が」「どのセッションの」「どの設問に」「どの選択肢を」「何ミリ秒で」回答したかを1レコードで表す。`score`は正解・回答速度から計算した結果を保存する（毎回計算し直さずに済むように）。
- **QUESTION.type**: `choice`（4択）, `true_false`（○×）, `survey`（アンケート）の3種類。アンケートの場合、対応する`CHOICE`の`is_correct`はすべて`false`になる。
- **QUESTION**に上限数の制約は設けない（1問以上であれば任意の数）。
