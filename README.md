<!--
---
id: day025
slug: morse-tree-visualizer

title: "MorseTree Visualizer"

subtitle_ja: "モールス信号を視覚化する学習ツール"
subtitle_en: "Interactive Morse Code Learning Tool with Tree and Chart Visualization"

description_ja: "モールス信号を二分木とチャートで視覚化し、変換・学習・打鍵・出所つきの雑学を通じて学べるWebツール"
description_en: "An interactive Morse code learning tool with tree and chart views, encoding, decoding, quizzes, keying, and sourced trivia"

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

[English](README.en.md) · 日本語

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

![打鍵で最後のSが確定待ちになった画面](assets/screenshot5.png)
> *SOSを打ち、SOが確定したあと、最後のSが確定待ちで点灯中の状態です。押した長さも確認できます。*

![SKの詳細表と手続き符号のラベル](assets/screenshot6.png)
> *エンコードタブで「<SK>」を変換し、手続き符号のラベルを表示しています。*

![ダークテーマのSOSと音の設定](assets/screenshot7.png)
> *SOSの再生後のSの経路、音の設定、ランプをダークテーマで表示しています。*

![SOSと手続き符号を表示したチャート](assets/screenshot8.png)
> *チャートでSとOの経路を同時に点灯し、手続き符号SN・SKも表示しています。1280×1100px、55,792バイト（約56KB）。*

![数学の3枚に絞り込んだ雑学タブ](assets/screenshot9.png)
> *平均符号長・ハフマン符号・組み合わせの3枚と、それぞれの出所を表示しています。1280×1100px、95,936バイト（約96KB）。*

![和文モールスの二分木で経路を点灯](assets/screenshot10.png)
> *和文の「モールス」を変換し、4文字の経路を二分木で点灯しています。1280×1100px、84,998バイト。*

![和文モールスのチャートで経路を点灯](assets/screenshot11.png)
> *和文の「モールス」の経路をチャートで点灯しています。1280×1100px、56,020バイト。*

## ✨ 機能

- 英語⇒モールス、モールス⇒英語、学習、一覧表、打鍵、雑学の6タブ
- 日本語／英語の画面切り替え、言語の保存と`?lang=ja`／`?lang=en`での指定
- 欧文／和文の符号切り替え、和文65件の変換と学習、符号の保存と`?code=wabun`での指定
- 二分木／チャートの表示切り替え、4つの木の同期と設定の保存
- 出所つきの雑学16枚、7分野での絞り込み、実行時の数値計算と「ツールで試す」
- ASCIIの`.-`と`・−`の入力・表示・コピー
- ITUタイミングに沿った経路再生、一時停止・再開・停止・前後の手動ステップ
- 音と木の点灯の同期、周波数・音量・小さなランプの選択
- 文字速度と全体速度を分けるFarnsworth方式（文字速度5〜25WPM）
- Spaceキー・マウス・タッチでの打鍵と側音、押した長さの表示
- 手続き符号9件、1,000文字までの入力を含むURLの共有
- ライト・ダーク・システム連動のテーマと一覧表のPDF印刷
- デコード欄へ入力中の符号を木がリアルタイムに追う機能
- 双方向クイズ、出題範囲の選択、セッション内の正答数と連続正解
- ITU 50文字と慣用5文字の区別、深さ6の木と「木の外」の注記
- キーボード操作とモバイル対応（木は縮小せず、箱の中を横スクロール）

## 📖 使い方

上部の「符号」で欧文または和文を選びます。以下の英文例と手続き符号は欧文を選んだ場合です。
和文では「モールス」「イロハ」「がっこう」「サクラ サク」を入力補助に使えます。

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
英字27・数字10・記号18・手続き符号9件の対応を確認できます。ITUと慣用のバッジを付け、表記の切り替えも反映します。
和文では仮名48、濁点と半濁点2、数字10、記号5の4群になり、種類の代わりに名前を表示します。
英語の画面では仮名のName欄にヘボン式のローマ字を表示します。

### ⌨ 打鍵

1. 「⌨ 打鍵」タブを選択し、打鍵の速さを選ぶ。
2. 「キー／Space」ボタンかSpaceキーを短く押してドット、長く押してダッシュを入れる。
3. 確定待ちの符号・文字・押した長さのバーを確認する。
4. 「デコードへ送る」で入力した符号を復号タブへ移す。

手続き符号は英文欄に`HELLO <AR>`のように山かっこで囲んで入力します。
`AR`の2文字を続けて打つのではなく、1つの符号として送ります。

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

### 🧭 木の見た目

木の上の「木の見た目」で「二分木」または「チャート」を選びます。
選択は4つの木に共通で、次回も同じ見た目を使います。保存が禁止された環境でも、そのページ内では切り替えられます。
切り替えると点灯と再生を停止します。続けて音を聞くときは「再生」を押してください。

### 🔍 雑学

「雑学」タブを開き、分野のボタンでカードを絞り込みます。「すべて」で16枚に戻せます。
「出所」のリンクで根拠となる資料を開けます。「ツールで試す」があるカードでは、関連するタブへ移動します。
例がある場合は入力と変換まで行い、音や再生は始めません。

## 📐 画面構成

上部に6つのタブ、表記と符号の選択、各変換タブに入力・結果・再生制御・木を配置しています。
学習タブは文字確認とランダム出題に分かれます。ヘルプは右上の「？」から開けます。

ヘッダーの「EN／JA」で画面の言語を切り替えます。
初期言語は`?lang=ja`／`?lang=en`、保存した選択、ブラウザーの言語の順に決まり、日本語以外は英語になります。
英語で開いたときの既定表記はASCIIの`.-`、日本語では`・−`です。
手動で選んだ表記は、その後に言語を切り替えても保持します。
言語の切り替えは入力・結果・点灯・タブ・スクロール位置を保ち、再生中なら停止します。音は始めません。

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

## 🔊 音とFarnsworth

文字速度を18WPM、全体速度を5WPMにすると、符号の音は18WPMのまま、文字と語の間を長く取れます。
初期値は音がオフ、文字速度15WPM・全体速度10WPM、700Hz・音量50%です。全体速度は文字速度以下に制限します。
「🔊 音」をオンにしてから再生すると音が鳴ります。
オンにしただけではAudioContextを作らず、その後の最初の再生操作で作ります。
音がオフの場合や音を使えない環境では、木だけで学習できます。

文字速度をc、全体速度をsとしたとき、1unitは`1200/c`msです。
s<cでは`a=(60c−37.2s)/(s×c)×1000`msを計算し、文字間を`3a/19`、語間を`7a/19`に置き換えます。
元の3unit・7unitに加算する式ではありません。s=cでは通常の時間比を使います。

| 文字速度c | 全体速度s | unit（ms） | 文字間（ms） | 語間（ms） |
|---|---|---|---|---|
| 15 | 15 | 80.0 | 240.0 | 560.0 |
| 18 | 10 | 66.7 | 621.1 | 1449.1 |
| 18 | 5 | 66.7 | 1568.4 | 3659.6 |

PARISの末尾に次の語までの間隔を含めると、1語は60/s秒になります。18/5WPMなら12秒です。
計算は[ARRLのFarnsworth方式](https://www.arrl.org/files/file/Technology/x9004008.pdf)に基づきます。

ランプは40px角、初期状態ではオフです。点滅する面を小さくするための設計で、画面全体は点滅させません。
動きを減らす設定ではランプを表示せず、木は一括点灯しますが、音の間隔は変わりません。
点滅の面積と回数に関する根拠は[WCAG 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)です。

## ⌨️ 打鍵で覚える

打鍵の速さから求めた1unitをuとし、押す長さが2u未満ならドット、2u以上ならダッシュと判定します。
次に押すまでの間隔は2u未満が同じ文字、2u以上5u未満が次の文字、5u以上が次の語です。
10WPMではu=120msなので、300msの間隔を空けてSとOを打つと`SO`になります。

次の押下がない場合は、離して2u後に確定待ちの符号を表示し、5u後に文字、10u後に語の区切りを確定します。
文字が確定すると木の点灯は消えます。入力欄やセレクトにフォーカスがあるときのSpaceは打鍵に使いません。
側音の音量・周波数・音のオン／オフは再生タブと共有します。
初期状態では側音も鳴りません。「🔊 音」をオンにすると、打鍵タブの「側音」がオンのときだけ音が鳴ります。

## 🇯🇵 和文モールス

「符号」で和文を選ぶと、「がっこう」は「カ゛ツコウ」に正規化され、`.-.. .. .--. ---- ..-`へ変換されます。
和文の表は[無線局運用規則 別表第一号「１ 和文」](https://laws.e-gov.go.jp/law/325M50080000017)を出所とします。
仮名48、濁点と半濁点2、数字10、記号5の計65件を掲載順（イロハ順）に収録しています。

欧文と同じ符号で別の文字になるものが35件あるため、変換する前に符号を選びます。
たとえば`.-`は欧文のA、和文のイです。
選択は`morse-tree-system`へ保存し、起動時は有効な`?code=wabun`／`?code=intl`、保存値、欧文の順に決まります。
画面の言語と符号は別の設定です。英語の画面でも和文を使えます。

次の正規化は、規則の本文にない、本ツールの扱いです。

1. NFKCで全角と半角をそろえる。
2. ひらがなをカタカナにする。
3. NFDで濁点と半濁点を分離し、結合文字を表の「゛」「゜」にする（ガ→カ゛、パ→ハ゜、ヴ→ウ゛）。
4. 小書きの仮名を並字にする（ァィゥェォッャュョヮヵヶ→アイウエオツヤユヨワカケ）。
5. NFKCで半角になった括弧を表の全角「（」「）」へ戻す。
6. 全角空白と半角空白を語の区切りにする。

英字や「。」など、表にない文字はエラーにします。「。」を「、」へ置き換えません。
これは文字のエンコードに対する扱いであり、復号欄が「。」をドットとして受け付ける動作とは別です。
復号と打鍵では、濁点または半濁点が直前の文字とNFCで1文字になるときだけ合成します。
`.-.. ..`はガ、`.-.-. ..`は合成できないためン゛になります。

ホレ／ラタの切替信号は、この65件の文字表には追加しません。
本ツールは画面の「符号」で欧文と和文を切り替える設計で、入力途中の切替信号を解釈する通信手順は対象外です。
和文では欧文の手続き符号とその表示スイッチも使いません。

和文の二分木は67ノードで葉33、チャートは66ノードで720×920px（11列×16段）です。
濁点は短い斜線2本、半濁点は輪のSVG図形で表示し、タイトルにも名前を付けます。
符号の切り替えは入力を消さず、再生を停止して表示中の変換タブを再変換します。音は始めません。
非表示タブの結果は、次に開いたときに再変換します。
学習の出題範囲は仮名、濁点と半濁点、数字、記号の4群で、符号を切り替えると成績をリセットします。

## 📡 手続き符号

以下は欧文を選んだ場合の手続き符号です。

| 名前 | ASCII符号 | 意味 | 区分 | 同じ符号の文字 |
|---|---|---|---|---|
| AR | `.-.-.` | 送信終了 | ITU | + |
| SK | `...-.-` | 通信終了 | ITU | — |
| BT | `-...-` | 区切り | ITU | = |
| KA | `-.-.-` | 開始 | ITU | — |
| SN | `...-.` | 了解 | ITU | — |
| HH | `........` | 訂正 | ITU | — |
| K | `-.-` | 送信どうぞ | ITU | K |
| AS | `.-...` | 待て | ITU | & |
| SOS | `...---...` | 救難 | 慣用 | — |

ここでいう1符号のSOSはITU-R M.1677-1にはないため、慣用として区別しています。
`SOS`は3文字、`<SOS>`は9要素が連続する1符号です。HHとSOSは深さ6の木の外にあり、文字列と詳細表で確認します。
「手続き符号を表示」をオンにすると、木にAR・SK・BT・KA・SN・K・ASのラベルが付きます。
符号が文字と重なる場合、復号は文字を優先します。たとえば`.-.-.`は`+`、`.-...`は`&`です。

## 🔗 入力の共有

エンコード・デコードの「共有URLをコピー」で、入力を含むURLを作れます。上限は1,000文字です。
`?text=SOS`または`?morse=...%20---%20...`で開くと対応するタブへ入力し、変換します。両方の指定はエラーです。
共有URLを開いただけでは音を鳴らしません。URLには入力が残るため、秘密の文字列は共有しないでください。
和文で作ったURLには`code=wabun`が付きます。`?code=wabun&text=モールス`は和文で開き、再生せずに変換します。
欧文のURL形式は従来どおりです。保存した和文の設定を上書きして開く場合は`code=intl`を指定できます。

## 🎨 テーマ

ヘッダーのテーマボタンはライト→ダーク→システム連動の順に切り替わります。
初期状態はシステム連動で、選択はlocalStorageへ保存します。保存を禁止した環境でも切り替えられます。

## 🖨️ 印刷（PDF保存）

一覧表タブの「印刷（PDFに保存）」を押し、ブラウザーの印刷ダイアログで「PDFに保存」を選びます。
英字27＋数字10＋記号18＋手続き符号9＝64行を2列にし、ASCIIと「・−」の両方を載せます。
和文では現在の65件を左右33行と32行に分け、和文の表題と名前を載せます。
印刷はダークテーマでもライト配色です。欧文はChromiumでA4縦の1ページに収まることを確認しています。
和文も同じA4縦1ページ用の印刷領域を使います。

## 🧭 チャート型の見た目

チャートは、基板型のモールス学習具でも使われる配置です。中心のstartから符号をたどります。

| 見る場所 | 読み方 |
|---|---|
| 中心から左側 | ダッシュから始まる符号 |
| 中心から右側 | ドットから始まる符号 |
| 丸 | 最後の符号がドット |
| 長方形 | 最後の符号がダッシュ |
| 左側でさらに左へ | ダッシュを追加 |
| 右側でさらに右へ | ドットを追加 |
| 下へ | その側とは反対の符号を追加 |

下の子は、部分木と縦線の通り道がほかの節と重ならない最浅の段に置きます。段の番号は符号の長さではありません。
欧文は11列×14段、720×808pxの配置で、手続き符号を隠すと64ノード、表示すると66ノードが見えます。
SN・SKを隠しても、ほかの節は動きません。KAは記号の経路上の節、AR・BT・AS・Kは文字と同じ節に表示します。
破線の小さな節は空き、黄色の破線は慣用符号です。狭い画面では木の箱の中を横スクロールします。

## 🔍 雑学（他の分野とのつながり）

7分野16枚のカードから、モールスとほかの技術・歴史の関係を学べます。
平均符号長や接頭関係の数などは、文字表と文字頻度から実行時に計算しています。
出所のない話や、資料で確認できない由来・俗説は載せない方針です。各カードの資料は下の「参考」にもまとめています。

| 分野 | 見出し |
|---|---|
| 数学 | E は1、O は11 |
| 符号・情報 | ドットとダッシュだけでは足りない |
| 数学 | ハフマン符号と比べる |
| 数学 | 長さ4までで 30 通り |
| コンピューター | 木を下りる＝二分探索 |
| コンピューター | ASCII は7ビット、点字は6点、モールスは1〜7 |
| コンピューター | スマホのキーボードでもモールス |
| ネットワーク・通信 | QRS＝もっとゆっくり送って |
| ネットワーク・通信 | 航空機は今もモールスで局を確かめる |
| ネットワーク・通信 | 免許の必須科目から任意へ（2003） |
| 歴史 | ...---... は1906年に決まった |
| 歴史 | 最初の電信文 |
| サバイバル | 光と旗で3短3長3短 |
| 符号・情報 | 手続き符号は間を空けない |
| 暗号 | 符号と暗号は別物 |
| 暗号 | 暗号文はモールスに乗って飛んだ |

## 🔬 技術的な説明

### 文字表と木

欧文は`MORSE_TABLE`を文字表とし、英字27（A〜ZとÉ）、数字10、記号18（ITU 13＋慣用5）の計55文字を定義しています。
和文は`WABUN_TABLE`に65件を持ち、`currentTable()`で選択中の表を参照します。
ITU 50文字と慣用5文字を含みます。二分木はこの表から生成し、深さ5までの空ノードを補います。
手続き符号も含めると深さ6までで76ノード、葉34、深さ6のノード13です。葉へ左から30px間隔で座標を割り当て、親のx座標を存在する子の平均にします。

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

`&`の符号はITUのWait（待て）の手続き符号ASと同じです。`&`は文字、`<AS>`は手続き符号として入力できます。
`É`（accented e）はITUにある`..-..`です。

### チャートの配置と雑学の計算

`layoutTree`は二分木、`layoutChart`はチャートの座標を生成します。
チャートには`completeTo`を使わず、欧文では手続き符号を含む66ノードを常に配置します。
左右の部分木の形と縦線の通過セルを記憶し、横の子を先に、下の子を衝突しない最浅の段へ置きます。
列は−5〜5、行は0〜13で、座標は`x=360+col×64`、`y=40+row×56`です。
どちらの見た目も同じ`data-code`で点灯・再生・打鍵・クイズを扱います。設定キーは`morse-tree-layout`です。

`computeTrivia`は英字26字の要素数・時間長、接頭関係、長さ別の使用数、エントロピー、2値ハフマン符号長を計算します。
時間長はドット1・ダッシュ3・要素間1unitの合計で、文字間を含みません。
頻度は[Day018 CipherClimb](https://github.com/ipusiron/cipherclimb)の`ngramModel.js`に由来する、Project Gutenberg 10作品・5,141,270文字の集計です。
小数1桁に丸めた出現率を合計で割り直して正規化します。原資料の丸め前の頻度を使った結果とは区別します。

| 計算項目 | 値 |
|---|---|
| 均等な重みでの平均要素数 | 3.15 |
| 頻度で重みづけした平均要素数 | 2.54 |
| 均等な重みでの平均時間長 | 8.23 unit |
| 頻度で重みづけした平均時間長 | 6.09 unit（26.0%短縮） |
| 同じ符号を頻度順に割り当て直した平均時間長 | 5.69 unit（さらに6.6%短縮） |
| 固定長の2値符号 | 5ビット |
| 出現率のエントロピー | 4.17ビット |
| 2値ハフマン符号の平均長 | 4.20ビット |
| 接頭関係の順序対 | 英字26字で56組、55文字で168組 |

カードの小数は2桁、短縮率は1桁で表示します。モールスの要素数とハフマンのビット数は、区切りを含む条件が違うため直接比較できません。

### 時間比と速度

ITU-R M.1677-1の§2に従い、ドット1・ダッシュ3・要素間1・文字間3・語間7の時間比を使います。
1unitは`1200/WPM`msで、10WPMなら120msです。
PARISは文字と文字間で43unit、次の語までの7unitを加えて50unitとなります。
10/10WPMではSOSは27unit＝3,240ms、HELLO WORLDは111unit＝13,320msです。
音がオンで使用できる場合はWeb Audioへ音を予約し、`AudioContext.currentTime`を基準に`requestAnimationFrame`で木を更新します。
音なしではタイマーで再生します。描画フレームやブラウザーの処理負荷による遅れは生じます。
打鍵では`performance.now()`で押下と解放の時刻を取り、2u・5uの境界から符号と区切りを判定します。

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
`...---...`は手続き符号`<SOS>`へ復号します。S・O・Sの3文字なら`... --- ...`と入力します。
クイズの抽選には`crypto.getRandomValues`と剰余の偏りを避ける処理を使い、直前の文字は候補から外します。

## 🔒 セキュリティ

画面は入力を`textContent`で描画し、HTMLとして解釈しません。インラインイベント・style属性を除き、meta CSPで同一オリジンのスクリプトとCSSに制限しています。
referrerは`no-referrer`、外部リンクは`noopener noreferrer`です。ページを開いて操作したときの外部ホストへの要求はChromiumで0件でした。
テーマ、木の見た目、言語、符号の選択を保存し、入力や成績は自動保存しません。共有URLには明示的に入力を含めるため、共有先やブラウザーの履歴に残ることがあります。

meta CSPではクリックジャッキングを防げません。`frame-ancestors`はHTTPヘッダー専用で、GitHub Pagesでは任意のレスポンスヘッダーを設定できません。
利用者がGitHubやカードの出所のリンクを開いた場合は、そのサイトへの通信が発生します。カードの表示時には出所を取得しません。

## ⚠️ 注意

- `file://`では動作しない。ES moduleを同一オリジンとして読み込めないブラウザーの制約があるため、HTTP配信が必要
- 大文字化により`ß`→`SS`など文字数が変わる場合がある
- アクセント文字はÉ以外に非対応
- 慣用符号は通信環境によって異なる場合がある
- iOSでは音の開始にタップが必要。iOS実機は未検証
- PNG保存は未対応

## ❓ FAQ

### 音が出ない理由

音は初期状態ではオフです。「🔊 音」をオンにし、音量が0になっていないかを確認して「再生」を押してください。
ブラウザーの自動再生ポリシーにより、最初に操作が必要です。音を使えない環境では木の表示だけで動きます。

### 入力中の木と変換結果の違い

デコード欄への入力中は、最後の符号の経路だけを追います。復号結果を更新するにはデコードボタンかEnterで実行します。

### スマートフォンで木が横長になる理由

文字を読める大きさに保つため、二分木は1080×470px、チャートは欧文720×808px、和文720×920pxで表示します。ページ全体ではなく木の箱の中を横スクロールします。

## 🔗 参考

- [ITU-R M.1677-1 “International Morse code”](https://www.itu.int/rec/R-REC-M.1677-1-200910-I/en)（Annex 1 Part Iの文字表と§2の時間比）
- [ARRL “A Standard for Morse Timing Using the Farnsworth Technique”](https://www.arrl.org/files/file/Technology/x9004008.pdf)（PARIS基準と文字間・語間の計算）
- [WCAG 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)（点滅の回数と面積）
- [MDN Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)（音声開始時のユーザー操作）

- [Project Gutenberg 10作品（Day018 CipherClimb）](https://github.com/ipusiron/cipherclimb)
- [D. A. Huffman, A Method for the Construction of Minimum-Redundancy Codes（1952）](https://doi.org/10.1109/JRPROC.1952.273898)
- [RFC 20](https://www.rfc-editor.org/rfc/rfc20.txt)
- [Braille Authority of North America, Size and Spacing of Braille Characters](https://www.brailleauthority.org/size-and-spacing-braille-characters)
- [Google The Keyword, Making Morse code available to more people on Gboard（2018-07-11）](https://blog.google/products-and-platforms/products/search/making-morse-code-available-more-people-gboard/)
- [ITU-R M.1172（海上移動業務の略号と信号）](https://www.itu.int/rec/R-REC-M.1172-0-199510-I/en)
- [FAA Aeronautical Information Manual 1-1-3（VOR）](https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html)
- [ITU, WRC-03 Final Acts, MOD 25.5](https://www.itu.int/dms_pub/itu-r/opb/act/R-ACT-WRC.7-2003-PDF-E.pdf)
- [International Radiotelegraph Convention of Berlin, 1906, Service Regulations XVI（ITU History Portal）](https://search.itu.int/history/HistoryDigitalCollectionDocLibrary/4.37.57.en.100.pdf)
- [Library of Congress, First telegraph message, 24 May 1844](https://www.loc.gov/item/mcc.019/)
- [FM 21-76 U.S. Army Survival Manual（Internet Archiveの再版）](https://archive.org/details/Fm21-76SurvivalManual)
- [Encyclopaedia Britannica, Cryptology](https://www.britannica.com/topic/cryptology)
- [W. Clauson-Thue, The ABC Universal Commercial Electric Telegraphic Code（1881）](https://archive.org/details/abcuniversalco00clau)
- [Bletchley Park Trust, Enigma Red messages](https://www.bletchleypark.org.uk/our-story/enigma-red-messages/)
- [Y Stations: Interception](https://www.bletchleypark.org.uk/about-y-stations/work-at-the-y-stations/y-stations-interception/)

## 🧪 テスト

Node 22以上で`npm test`を実行します。依存パッケージのインストールは不要です。
GitHub Actionsもpushとpull_requestで同じテストを実行します。READMEの例・表・画像参照も検証対象です。

| ファイル | 検証する内容 |
|---|---|
| codec.test.js | 正規化・変換・往復・境界・エラー |
| table.test.js | 55文字・ITU／慣用・一意性・順序 |
| tree.test.js | 文字表のみ75ノード・手続き符号込み76ノード・葉34・座標 |
| chart.test.js | チャート66ノードの全座標・衝突・縦線の通り道・設定保存 |
| frequency.test.js | 出現頻度26個・正規化と上位5文字 |
| trivia.test.js | 平均値・ハフマン・接頭関係・16カード・出所・文字列の整形 |
| timing.test.js | ITU時間比・Farnsworth・PARIS・SOSの音の予定表 |
| messages.test.js | 辞書とJS内の日本語リテラル |
| html.test.js | CSP・referrer・ARIA・属性とラベル |
| i18n.test.js | 日英辞書・初期言語・保存制限・状態を保つ切り替え・一覧表と印刷 |
| contrast.test.js | 配色の4.5:1以上 |
| format.test.js | 行数・行長 |
| readme.test.js | 日英の表・例・節構成・YAML・ツリー・画像・相互リンク |
| keying.test.js | 打鍵の2u・5uの境界と乱れた入力 |
| prosign.test.js | 手続き符号9件・変換・復号と別名 |
| share.test.js | URLの解析・1,000文字制限・生成 |
| theme.test.js | 保存の失敗とテーマの変数集合 |
| static.test.js | 印刷用CSS・禁止する通信手段 |
| wabun.test.js | 和文65行、変換と復号、木の67ノード、チャート66行の座標 |
| system.test.js | 符号選択と保存、無音の切り替え、4つの木、学習範囲、一覧65行、印刷、打鍵、共有 |

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
├── README.en.md                    # 日本語版と同じ節構成の英語ドキュメント
├── assets/                         # README用の画像
│   ├── en/                         # 英語UIのスクリーンショット
│   │   ├── screenshot.png          # SOSの変換結果とS・Oの点灯
│   │   ├── screenshot2.png         # LOVEの復号結果と詳細表
│   │   ├── screenshot3.png         # Qの正解と成績
│   │   ├── screenshot4.png         # 英字と数字の一覧表
│   │   ├── screenshot5.png         # 打鍵でSOが確定し最後のSが確定待ちの状態
│   │   ├── screenshot6.png         # SKの詳細表と手続き符号のラベル
│   │   ├── screenshot7.png         # ダークテーマのSOSと音の設定
│   │   ├── screenshot8.png         # SOSと手続き符号を表示したチャート
│   │   ├── screenshot9.png         # 数学3枚に絞り込んだ雑学タブ
│   │   ├── screenshot10.png        # 和文のモールスを二分木で点灯
│   │   └── screenshot11.png        # 和文のモールスをチャートで点灯
│   ├── screenshot.png              # SOSの変換結果とS・Oの点灯
│   ├── screenshot2.png             # LOVEの復号結果と詳細表
│   ├── screenshot3.png             # Qの正解と成績
│   ├── screenshot4.png             # ITUと慣用の一覧表
│   ├── screenshot5.png             # 打鍵でSOが確定し最後のSが確定待ちの状態
│   ├── screenshot6.png             # SKの詳細表と手続き符号のラベル
│   ├── screenshot7.png             # ダークテーマのSOSと音の設定
│   ├── screenshot8.png             # SOSと手続き符号を表示したチャート
│   ├── screenshot9.png             # 数学3枚に絞り込んだ雑学タブ
│   ├── screenshot10.png            # 和文のモールスを二分木で点灯
│   └── screenshot11.png            # 和文のモールスをチャートで点灯
├── index.html                      # 6タブ・ヘルプ・CSPのマークアップ
├── js/                             # JavaScriptのES module
│   ├── animator.js                 # 1符号ずつの再生と一時停止・手動ステップ
│   ├── audio.js                    # Web Audioの音の予約と打鍵側音
│   ├── decode.js                   # 復号と入力支援・リアルタイム追従
│   ├── encode.js                   # 英文の変換と結果・コピー・再生
│   ├── frequency.js                # Day018由来の英字出現頻度
│   ├── i18n.js                     # 初期言語の選択・保存と画面文言の切り替え
│   ├── keying.js                   # 押し離しから符号と文字を確定する打鍵タブ
│   ├── layout.js                   # 木の見た目の保存と4か所の同期
│   ├── messages.js                 # 画面文言の日英辞書
│   ├── morseCodec.js               # 入力正規化・変換・経路・ITUタイミング
│   ├── morseMap.js                 # 55文字と手続き符号9件の定義・表記
│   ├── morseTree.js                # 文字表から木を生成し座標を決定
│   ├── script.js                   # 起動・タブ・ヘルプの操作
│   ├── share.js                    # 共有URLの入力解析と生成
│   ├── study.js                    # 文字確認・クイズ・成績
│   ├── system.js                   # 欧文と和文の選択・保存・現在の符号表
│   ├── table.js                    # ITUと慣用を区別する一覧表
│   ├── theme.js                    # ライト・ダーク・システム連動と保存
│   ├── treeRenderer.js             # 木ごとのSVG描画と点灯・追従
│   ├── trivia.js                   # 雑学16枚・出所・数値計算と本文の整形
│   ├── utils.js                    # 安全なDOM生成と共通制御
│   └── wabunMap.js                 # 和文65件とローマ字・翻訳キーの定義
├── package.json                    # 依存なしのnpm test定義
├── style.css                       # 配色変数とモバイル・木の表示
└── test/                           # 依存なしの自動テスト
    ├── chart.test.js               # チャート型の66ノード座標と衝突
    ├── codec.test.js               # 変換例・往復・正規化・境界
    ├── contrast.test.js            # 文字と面の4.5:1以上
    ├── format.test.js              # 行長と行数
    ├── frequency.test.js           # 英字出現頻度の正規化と順位
    ├── html.test.js                # CSP・ARIA・属性とラベル
    ├── i18n.test.js                # 日英辞書の整合性・初期言語・保存制限
    ├── keying.test.js              # 打鍵の時間境界と符号・文字の確定
    ├── messages.test.js            # 辞書と日本語リテラルの集約
    ├── prosign.test.js             # 手続き符号9件と変換・復号
    ├── readme.test.js              # 日英の表・例・節構成・画像・ツリー・YAML
    ├── share.test.js               # 共有URLの解析と長さ制限
    ├── static.test.js              # 印刷用CSSと外部通信手段なしの検証
    ├── system.test.js              # 符号選択・保存・再変換と木の切り替え
    ├── table.test.js               # 文字表の件数・順序・符号
    ├── theme.test.js               # テーマの保存と変数集合の検証
    ├── timing.test.js              # ITU時間比とPARIS・SOS
    ├── tree.test.js                # 文字表75・手続き符号込み76ノード・葉34・座標
    ├── trivia.test.js              # 実行時に計算する雑学の数値
    └── wabun.test.js               # 和文65行・正規化・変換・復号・木とチャート
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
