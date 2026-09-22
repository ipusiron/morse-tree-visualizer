<!--
---
id: day025
slug: morse-tree-visualizer

title: "MorseTree Visualizer"

subtitle_ja: "モールス信号を視覚化する学習ツール"
subtitle_en: "Interactive Morse Code Learning Tool with Binary Tree Visualization"

description_ja: "モールス信号をバイナリツリー構造で視覚化し、エンコード・デコード・学習モードを通じて直感的に学べるインタラクティブなWebツール"
description_en: "An interactive web tool that visualizes Morse code as a binary tree structure, enabling intuitive learning through encoding, decoding, and study modes"

category_ja:
  - モールス信号
  - 符号化
category_en:
  - Morse Code
  - Encoding

difficulty: 2

tags:
  - binary-tree
  - visualization
  - education
  - encoder
  - decoder

repo_url: "https://github.com/ipusiron/morse-tree-visualizer"
demo_url: "https://ipusiron.github.io/morse-tree-visualizer/"

hub: true
---
-->

# MorseTree Visualizer - モールス符号を木の上の経路として学ぶ可視化ツール

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/morse-tree-visualizer?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/morse-tree-visualizer?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/morse-tree-visualizer)
![GitHub license](https://img.shields.io/github/license/ipusiron/morse-tree-visualizer)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/morse-tree-visualizer/)

**Day025 - 生成AIで作るセキュリティツール100**

**MorseTree Visualizer**は、単なる変換ツールではありません。
入力された文字のモールス信号を、モールスツリー上の経路として順に点灯表示します。

「モールス脳」を育てる、視覚×体験型のインタラクティブ学習ツールです。

## 🌐 デモページ

[ブラウザーでMorseTree Visualizerを開く](https://ipusiron.github.io/morse-tree-visualizer/)

## 📸 スクリーンショット

![SOSの経路を点灯したエンコード画面](assets/screenshot.png)
> *SOSを変換し、SとOの経路を同時に点灯した状態。詳細表は閉じています。*

![LOVEの復号結果と詳細表](assets/screenshot2.png)
> *ASCIIの「.-.. --- ...- .」を復号した結果と詳細表、木の経路です。*

![Qに正解した学習モード](assets/screenshot3.png)
> *符号→文字のクイズでQに正解し、正答1／出題1（連続1）を表示しています。*

![ITUと慣用を区別する一覧表](assets/screenshot4.png)
> *英字・数字・記号の3グループとバッジ、&の注記を確認できます。*

## ✨ 機能

- 英語⇒モールス、モールス⇒英語、学習、一覧表の4タブ
- ASCIIの`.-`と`・−`の入力・表示・コピー
- ITUタイミングに沿った経路再生、一時停止・再開・停止・前後の手動ステップ
- 5／10／15／20WPMの速度選択
- デコード欄へ入力中の符号を木がリアルタイムに追う機能
- 双方向クイズ、出題範囲の選択、セッション内の正答数と連続正解
- ITU 50文字と慣用5文字の区別、深さ6の木と「木の外」の注記
- キーボード操作とモバイル対応（木は縮小せず、箱の中を横スクロール）

## 📖 使い方

### 📝 英語 ⇒ モールス変換

1. 「英語 ⇒ モールス信号」タブを選択
2. テキスト入力欄に英語を入力（例：HELLO）
3. 「エンコード＆表示」ボタンをクリック
4. モールス信号が表示され、ツリー上でアニメーション表示
5. 「📋 コピー」ボタンでクリップボードにコピー可能

### 🔓 モールス ⇒ 英語復号

1. 「モールス信号 ⇒ 英語」タブを選択
2. モールス信号を入力（手入力または文字ボタン使用）
3. ASDF GHJK・SOS・HELLO WORLD・CQ CQ DE JA1ABCのサンプルから選択
4. 「デコード」ボタンまたは入力欄のEnterで実行（Shift+Enterは改行）
5. 英語に復号され、木の経路を再生

### 📚 学習モード

- **文字確認**: 文字を選択してモールス信号と経路を確認
- **ランダム出題**: 符号→文字または文字→符号を選び、英字・数字・記号の範囲で回答。Enterで答え合わせ、もう一度Enterで次の問題

### 📊 モールス信号一覧表
英字27・数字10・記号18の対応を確認できます。ITUと慣用のバッジを付け、表記の切り替えも反映します。

### 入力と変換の例

エンコードの改行・タブ・全角空白は語の区切りになります。表中の「（改行）」は実際の改行、「（空白3つ）」は半角空白3つを表します。

| 操作 | 入力 | 結果 |
|---|---|---|
| encode | `SOS` | `・・・ −−− ・・・` |
| encode | `HELLO WORLD` | `・・・・ ・ ・−・・ ・−・・ −−− / ・−− −−− ・−・ ・−・・ −・・` |
| encode | `Hello,（改行）World!` | `・・・・ ・ ・−・・ ・−・・ −−− −−・・−− / ・−− −−− ・−・ ・−・・ −・・ −・−・−−` |
| decode | `.- ...` | `AS` |
| decode | `.-（空白3つ）...` | `A S` |

表示表記を切り替えると結果・コピー・一覧表も切り替わります。たとえばSOSはASCII表記で`... --- ...`です。
変換後は自動で再生します。動きを減らす設定のブラウザーでは、文全体の経路を一度に点灯します。手動ステップはどちらでも使えます。

### WPM（再生速度）

WPMはモールス信号の速さです。数値が小さいほどゆっくり、大きいほど速く再生します。20 WPMは10 WPMの2倍の速さです。
木の経路をゆっくり確認したいときは、5 WPMから試してください。変更後は「再生」を押すと、選んだ速さで最初から再生します。

エンコード・デコードのWPMの隣にある「?」からも説明を読めます。マウスを重ねるか、タップ、キーボードでフォーカスすると表示します。
Esc、もう一度のクリック・タップ、または説明の外をクリック・タップすると閉じます。Tabで次の操作へ移っても閉じます。
動きを減らす設定ではWPMにかかわらず全経路が一度に点灯するため、経路を順に確認するには手動ステップを使ってください。

## 📐 画面構成

上部に4つのタブと表記の選択、各変換タブに入力・結果・再生制御・木を配置しています。
学習タブは文字確認とランダム出題に分かれます。ヘルプは右上の「？」から開けます。

- タブ移動：←／→、先頭・末尾：Home／End
- デコード実行：入力欄のEnter、改行：Shift+Enter
- クイズ回答・次問：回答欄のEnter
- ヘルプを閉じる：Esc。閉じると開いたボタンへフォーカスが戻る

## 🎯 ユースケース

- モールス信号初心者や趣味の学習者の文字と符号の対応練習
- アマチュア無線での符号学習の補助
- 情報技術・STEM教育での信号処理の説明
- プログラミング講師による二分木と探索経路の可視化
- セキュリティエンジニアによる符号化と暗号の違いの学習

## 🔬 技術的な説明

### 文字表と木

`MORSE_TABLE`を唯一の文字表とし、英字27（A〜ZとÉ）、数字10、記号18（ITU 13＋慣用5）の計55文字を定義しています。
ITU 50文字と慣用5文字を含みます。木はこの表から生成し、深さ5までの空ノードを補います。
深さ6までで75ノード、葉34、深さ6のノード12です。葉へ左から30px間隔で座標を割り当て、親のx座標を存在する子の平均にします。

左の枝がドット、右の枝がダッシュです。破線の丸は空き、黄色い破線は慣用符号を示します。
`$`は7符号なので木の外です。変換・復号と詳細表には対応しますが、再生中も木は光りません。

| 区分 | 文字 | ASCII符号 |
|---|---|---|
| ITU | `.` | `.-.-.-` |
| ITU | `,` | `--..--` |
| ITU | `:` | `---...` |
| ITU | `?` | `..--..` |
| ITU | `'` | `.----.` |
| ITU | `-` | `-....-` |
| ITU | `/` | `-..-.` |
| ITU | `(` | `-.--.` |
| ITU | `)` | `-.--.-` |
| ITU | `"` | `.-..-.` |
| ITU | `=` | `-...-` |
| ITU | `+` | `.-.-.` |
| ITU | `@` | `.--.-.` |
| 慣用 | `!` | `-.-.--` |
| 慣用 | `&` | `.-...` |
| 慣用 | `;` | `-.-.-.` |
| 慣用 | `_` | `..--.-` |
| 慣用 | `$` | `...-..-` |

`&`の符号はITUのWait（待て）の手続き符号と同じです。本ツールでは文字として扱い、手続き符号の解釈は行いません。
`É`（accented e）はITUにある`..-..`です。

### 時間比と速度

ITU-R M.1677-1の§2に従い、ドット1・ダッシュ3・要素間1・文字間3・語間7の時間比を使います。
1unitは`1200/WPM`msで、10WPMなら120msです。
PARISは文字と文字間で43unit、次の語までの7unitを加えて50unitとなります。
SOSは27unit＝3,240ms、HELLO WORLDは111unit＝13,320msです。ブラウザーのタイマーによる遅れは生じます。

### 入力の正規化

英文はNFKC正規化→大文字化→連続空白を1つにまとめる順で処理します。
未対応文字が1つでもあれば変換を中止し、文字とU+XXXXを表示します。

| 用途 | 受け付ける記号・空白 |
|---|---|
| ドット | `.`、`・`、`·`、`•`、`∙`、`。` |
| ダッシュ | `-`、`−`、`–`、`—`、`―`、`_`、`ー`、`－` |
| 文字の区切り | 半角空白・タブ・NBSP（U+00A0）・全角空白（U+3000） |
| 語の区切り | `/`、縦棒（U+007C）、改行（LF／CR）、空白3つ以上 |

復号時はASCIIへ正規化します。空白2つまでは文字の区切りです。先頭・末尾や連続した語の区切りは空の語を作りません。
`...---...`を1文字として扱う機能はありません。S・O・Sの3文字なら`... --- ...`と入力します。
クイズの抽選には`crypto.getRandomValues`と剰余の偏りを避ける処理を使い、直前の文字は候補から外します。

## 🔒 セキュリティ

画面は入力を`textContent`で描画し、HTMLとして解釈しません。インラインイベント・style属性を除き、meta CSPで同一オリジンのスクリプトとCSSに制限しています。
referrerは`no-referrer`、外部リンクは`noopener noreferrer`です。ページを開いて操作したときの外部ホストへの要求はChromiumで0件でした。入力や成績を保存・送信する機能はありません。

meta CSPではクリックジャッキングを防げません。`frame-ancestors`はHTTPヘッダー専用で、GitHub Pagesでは任意のレスポンスヘッダーを設定できません。
外部のGitHubリンクを利用者が開いた場合は、そのサイトへの通信が発生します。

## ⚠️ 注意

- `file://`では動作しない。ES moduleを同一オリジンとして読み込めないブラウザーの制約があるため、HTTP配信が必要
- 大文字化により`ß`→`SS`など文字数が変わる場合がある
- アクセント文字はÉ以外に非対応
- 慣用符号は通信環境によって異なる場合がある
- 音の再生・打鍵入力・手続き符号・和文モールスは未対応

## ❓ FAQ

### 音が出ない理由

第1弾は木の経路と時間比の学習に絞っています。音は再生しません。

### 入力中の木と変換結果の違い

デコード欄への入力中は、最後の符号の経路だけを追います。復号結果を更新するにはデコードボタンかEnterで実行します。

### スマートフォンで木が横長になる理由

文字を読める大きさに保つため、木のSVGは1080×470pxで表示します。ページ全体ではなく木の箱の中を横スクロールします。

## 🔗 参考

- [ITU-R M.1677-1 “International Morse code”](https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en)（Annex 1 Part Iの文字表と§2の時間比）
- [ARRL “A Standard for Morse Timing Using the Farnsworth Technique”](https://www.arrl.org/files/file/Technology/x9004008.pdf)（PARISの50unit基準。Farnsworthの間隔拡張は未実装）

## 🧪 テスト

Node 22以上で`npm test`を実行します。依存パッケージのインストールは不要です。
GitHub Actionsもpushとpull_requestで同じテストを実行します。READMEの例・表・画像参照も検証対象です。

| ファイル | 検証する内容 |
|---|---|
| codec.test.js | 正規化・変換・往復・境界・エラー |
| table.test.js | 55文字・ITU／慣用・一意性・順序 |
| tree.test.js | 75ノード・葉34・座標 |
| timing.test.js | ITU時間比・PARIS・SOS |
| messages.test.js | 辞書とJS内の日本語リテラル |
| html.test.js | CSP・referrer・ARIA・属性とラベル |
| contrast.test.js | 配色の4.5:1以上 |
| format.test.js | 行数・行長 |
| readme.test.js | 表・例・YAML・ツリー・画像 |

## 📁 ディレクトリー構造

```text
morse-tree-visualizer/              # モールス符号を木の経路として学ぶツール
├── .github/                        # GitHubの設定
│   └── workflows/                  # 自動テストの設定
│       └── test.yml                # pushとpull_requestでNode 22のnpm testを実行
├── .gitignore                      # 依存フォルダー・ログ・個人設定をGit管理から除外
├── .nojekyll                       # GitHub PagesのJekyll処理を無効化
├── CLAUDE.md                       # AI向けの開発ガイド
├── LICENSE                         # MITライセンス
├── README.md                       # 使い方・仕様・検証の説明
├── assets/                         # README用の画像
│   ├── screenshot.png              # SOSの変換結果とS・Oの点灯
│   ├── screenshot2.png             # LOVEの復号結果と詳細表
│   ├── screenshot3.png             # Qの正解と成績
│   └── screenshot4.png             # ITUと慣用の一覧表
├── index.html                      # 4タブ・ヘルプ・CSPのマークアップ
├── js/                             # JavaScriptのES module
│   ├── animator.js                 # 1符号ずつの再生と一時停止・手動ステップ
│   ├── decode.js                   # 復号と入力支援・リアルタイム追従
│   ├── encode.js                   # 英文の変換と結果・コピー・再生
│   ├── messages.js                 # 動的な画面文言の日本語辞書
│   ├── morseCodec.js               # 入力正規化・変換・経路・ITUタイミング
│   ├── morseMap.js                 # 55文字の定義とASCII・日本語表記
│   ├── morseTree.js                # 文字表から木を生成し座標を決定
│   ├── script.js                   # 起動・タブ・ヘルプの操作
│   ├── share.js                    # 共有URLの入力解析と生成
│   ├── study.js                    # 文字確認・クイズ・成績
│   ├── table.js                    # ITUと慣用を区別する一覧表
│   ├── treeRenderer.js             # 木ごとのSVG描画と点灯・追従
│   └── utils.js                    # 安全なDOM生成と共通制御
├── package.json                    # 依存なしのnpm test定義
├── style.css                       # 配色変数とモバイル・木の表示
└── test/                           # 依存なしの自動テスト
    ├── codec.test.js               # 変換例・往復・正規化・境界
    ├── contrast.test.js            # 文字と面の4.5:1以上
    ├── format.test.js              # 行長と行数
    ├── html.test.js                # CSP・ARIA・属性とラベル
    ├── keying.test.js              # 打鍵の時間境界と符号・文字の確定
    ├── messages.test.js            # 辞書と日本語リテラルの集約
    ├── prosign.test.js             # 手続き符号9件と変換・復号
    ├── readme.test.js              # 表・例・画像・ツリー・YAML
    ├── share.test.js               # 共有URLの解析と長さ制限
    ├── table.test.js               # 文字表の件数・順序・符号
    ├── timing.test.js              # ITU時間比とPARIS・SOS
    └── tree.test.js                # 75ノード・葉34・座標
```

## 💻 動作環境

モダンブラウザーとHTTP配信が必要です。WindowsのChromiumで、1280・390・320pxの表示と主要操作を確認しています。
Firefox・Safariは今回の実機検証対象外です。サーバー以外のビルド処理はありません。

1. このリポジトリーをダウンロードまたはクローンする。
2. ローカルHTTPサーバーを起動する。

```bash
cd morse-tree-visualizer
python -m http.server 8000 --bind 127.0.0.1
```

3. ブラウザーで`http://127.0.0.1:8000/`を開く。

`file://`で直接開くとモジュールの読み込みが拒否されることをChromiumで確認しています。

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)をご覧ください。

## 🛠️ このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
