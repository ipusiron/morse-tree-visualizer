# MorseTree Visualizer - モールス信号を視覚化する学習ツール

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/morse-tree-visualizer?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/morse-tree-visualizer?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/morse-tree-visualizer)
![GitHub license](https://img.shields.io/github/license/ipusiron/morse-tree-visualizer)

**MorseTree Visualizer** は、モールス信号を視覚的に学べるインタラクティブなWebツールです。  
シンプルな変換器ではなく、「モールス脳」を育てる体験を提供することを目的としています。

---

## 🔗 デモページ

👉 [https://ipusiron.github.io/morse-tree-visualizer/](https://ipusiron.github.io/morse-tree-visualizer/)

---

## 📸 スクリーンショット

>![ダミー](assets/screenshot.png)
>
>*ダミー*

---

## ✨ 特徴

- 英字・数字・記号に対応した**完全なモールス信号一覧表**
- **3グループ（英字・数字・記号）**で視覚的に整理
- **レスポンシブ対応**：PCでもスマホでも見やすい
- 将来的に以下の機能も実装予定：

---

## 🚧 今後の実装予定（ロードマップ）

| 機能                           | 説明                                       |
|--------------------------------|--------------------------------------------|
| 英語 ⇒ モールス変換           | 入力文字列をリアルタイムで変換＆ツリー表示 |
| モールス ⇒ 英語復号           | モールスを逆変換し、経路をトレース表示     |
| モールスツリーの点灯アニメ    | 経路に沿ってノードを点灯・音再生対応       |
| 学習モード（フラッシュカード） | 任意文字 or ランダム出題で習熟を促進       |

---

## 🖼️ スクリーンショット

> 📷 一覧表示画面  
> ![screenshot](./assets/screenshot.png) ← 必要に応じて設置

---

## 📁 ディレクトリ構成（抜粋）

```
morse-tree-visualizer/
├── index.html
├── style.css
├── js/
│ ├── script.js
│ ├── table.js
│ ├── morseMap.js
│ └── morseTree.js
├── assets/
│ └── screenshot.png
```

---

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)をご覧ください。

---

## 🛠 このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
