# 概要
- 入力デバイスを選んで録音、waveファイルとして保存ができる

# 実装メモ
- web上で音声を扱うには[Web Audio API](https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API)を使う
- ただし録音部分には[RecordRTC](https://github.com/muaz-khan/RecordRTC)というパッケージを使った
    - ios/safari が Web Audio API への対応状況が悪いので自分で録音部分をやるとうまく行かないがち
    - [MediaRecorder](https://developer.mozilla.org/ja/docs/Web/API/MediaRecorder)が対応してないみたいなのでsaveができないっぽい


# 参考記事
- https://zenn.dev/chot/articles/42f9a64c88787e#%E9%8C%B2%E9%9F%B3api
