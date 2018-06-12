<template>
  <div>
    <div v-if="state.show">
      <button
       @click="state.confirm = true"
       class="button is-small is-warning"
       :class="{ 'is-loading': state.loading }"
       :disabled="state.loading">表示設定を削除する</button>
    </div>

    <modal v-if="state.confirm">
  		<h3 slot="header">表示設定を削除しますか？</h3>
      <p slot="body">表示がおかしい、エラーが出ているなどの場合有効です。</p>
      <button
       slot="footer"
       class="modal-default-button button is-small is-info"
       @click="state.confirm = false">NO</button>
      <button
       slot="footer"
       class="modal-default-button button is-small is-warning"
       @click="removeState">YES</button>
  	</modal>

    <modal v-if="state.error && useWebstorage === null">
      <h3 slot="header">表示設定データが見つかりません</h3>
      <p slot="body">一旦トップページへ戻りグラフが描画されたらこっちへ来てね。</p>
      <button
       slot="footer"
       class="modal-default-button button is-small is-warning"
       @click="backToTopPage">トップページへ戻る</button>
  	</modal>

    <modal v-if="state.error && useWebstorage !== null">
      <h3 slot="header">Syntax Error!</h3>
      <p slot="body">構文エラーを検知したため、設定データ削除をします。申し訳ございません。<br>
      頻発する場合は管理者にお問い合わせ下さい。</p>
      <button
       slot="footer"
       class="modal-default-button button is-small is-warning"
       @click="removeState">OK</button>
  	</modal>

    <modal v-if="state.remove">
  		<h3 slot="header">設定を削除しました。</h3>
      <p slot="body">一旦トップページへ戻りグラフが描画されたらこっちへ来てね。</p>
      <button
       slot="footer"
       class="modal-default-button button is-small is-warning"
       @click="backToTopPage">トップページへ戻る</button>
  	</modal>
  </div>
</template>

<script>
import modal from '@/components/modal';
import { mapActions } from 'vuex';

const env = require('../../../.env');

export default {
  name: 'delete-settings',
  props: ['state', 'wait'],
  data() {
    return {
      useWebstorage: localStorage.getItem(env.LOCAL_STORAGE_NAME),
    };
  },
  components: { modal },
  created(){
    if (this.useWebstorage && !this.wait) {
      this.state.show = true;
    }
  },
  watch: {
    wait(newValue){
      this.ctrlShowButton(newValue);
    },
  },
  methods: {
    ...mapActions([
      'clearState'
    ]),
    ctrlShowButton(newValue){
      if (!newValue) {
        this.state.show = true;
      }
    },
    getAgainLocalStorage(){
      this.useWebstorage = localStorage.getItem(env.LOCAL_STORAGE_NAME);
    },
    backToTopPage(){
      this.getAgainLocalStorage();
      this.state.error = false;
      this.state.remove = false;

      if (this.$route.path === '/') {
        // reload simulate
        this.$router.go({
          path: '/',
          // TOPページのデータ再fetch用
          query: { t: new Date().getTime() },
        });
      } else {
        this.clearState();
        this.$router.push({ path: '/' });
      }
    },
    removeState(){
      this.getAgainLocalStorage();
      this.state.loading = true;
      this.state.confirm = false;

      setTimeout(() => {
        localStorage.removeItem(env.LOCAL_STORAGE_NAME);
        this.state.remove = true;
        this.state.loading = false;
        this.state.error = false;
      }, 300);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>

</style>
