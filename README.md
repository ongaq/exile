# exile

## flow
Firebase HostingでデータをCloud Firestoreに送信しCloud FunctionsでGoogle spreadsheetsに書き込む。

`ongaq/gas-spreadsheet-support` 側では以下を処理する  
Google Apps Scriptが定時にGoogle spreadsheetsを見に行き手動で書き込まれていればCloud Firestoreに書き込む。  
Hosting側などからの入力で既にFirestoreにデータがあれば送らない。

## 開発
### 環境
Node.js v9.4.0

### ライブラリ
Vue.js + vuex + vue-router + webpack

### サーバーサイド
Firebase Hosting + Cloud Firestore + Cloud Functions
