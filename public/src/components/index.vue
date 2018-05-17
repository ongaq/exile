<template>
  <div class="idx">
    <router-link to="form" tag="button" class="button is-link">form</router-link>
    <br><br>
    <button id="submit" @click="init" v-show="!waiting" class="button is-info">直近2週間のデータを表示</button>
    <br><br>

    <pulse-loader v-if="waiting"></pulse-loader>
    <section class="fatPeople" v-show="currentShowUsers">
      <nav class="tabs is-boxed is-centered">
        <ul>
          <li v-for="(array, name) in currentUsersData" :key="name"
            :class="{ 'is-active': currentToggle[name] }"
            @click="toggle(name)">
            <a @click="fillData({
                date: currentUsersData[name].date,
                weight: currentUsersData[name].weight,
                fat: currentUsersData[name].fat
              })">
              <span>{{ nameConvert(name) }}</span>
            </a>
          </li>
        </ul>
      </nav>
      <line-chart :height="200" :chartData="currentChartData.weight" v-show="currentChartData.weight"></line-chart>
      <line-chart :height="200" :chartData="currentChartData.fat" v-show="currentChartData.fat"></line-chart>
    </section>

    <br><br><br>
    <!-- <img src="/static/matsuri.png" width="100%" alt="">
    <img src="/static/matsuri2.png" width="100%" alt=""> -->

    <!-- <modal v-if="showMaru">
  		<div slot="body">
        <img src="/static/maru.png" width="100%" alt="">
      </div>
      <div slot="footer" class="modal-migiue-button">
        <button @click="showMaru = false">✖︎</button>
      </div>
  	</modal> -->

    <modal v-if="showError" @close="showError = false">
  		<h3 slot="header">一部のデータの取得が出来ませんでした。</h3>
  	</modal>
  </div>
</template>

<script>
import * as firebase from 'firebase';
import * as moment from 'moment';
import { mapGetters, mapActions } from 'vuex';
import modal from '@/components/modal';
import LineChart from '@/components/LineChart';

const PulseLoader = require('vue-spinner/dist/vue-spinner.min').PulseLoader;
const env = require('../../../.env');
require('firebase/app');
require('firebase/firestore');

firebase.initializeApp({
  apiKey: env.API_KEY,
  databaseURL: env.DATABASE_URL,
  storageBucket: env.STORAGE_BUCKET,
  authDomain: env.AUTH_DOMAIN,
  messagingSenderId: env.MESSAGING_SENDER_ID,
  projectId: env.PROJECT_ID,
});
const firestore = firebase.firestore();
firestore.settings({ timestampsInSnapshots: true });

export default {
  name: 'index',
  data() {
    return {
      showModal: false,
      showError: false,
      showMaru: false,
      waiting: false,
      users: {
        yoshida: { date: [], weight: [], fat: [] },
        maruyama: { date: [], weight: [], fat: [] },
        hirata: { date: [], weight: [], fat: [] },
      },
      chartData: {
        weight: {
          labels: [],
          datasets: [{
            label: '体重',
            backgroundColor: 'transparent',
            pointBackgroundColor: 'white',
            borderWidth: 2,
            pointBorderColor: '#42b983',
            data: [],
          }],
        },
        fat: {
          labels: [],
          datasets: [{
            label: '体脂肪率',
            backgroundColor: 'transparent',
            pointBackgroundColor: 'white',
            borderWidth: 2,
            pointBorderColor: '#83b9b9',
            data: []
          }],
        },
      },
      showWeek: 14,
    };
  },
  components: { modal, PulseLoader, LineChart },
  computed: {
    ...mapGetters([
      'currentShowUsers',
      'currentUsersData',
      'currentChartData',
      'currentToggle'
    ])
  },
  methods: {
    ...mapActions([
      'usersData',
      'fillData',
      'toggle'
    ]),
    async init(){
      this.waiting = true;
      const keys = Object.keys(this.users);
      // 新しく値を取得しに行く
      const results = await this.fetchValueToFirestore(keys);

      // 多重データ書き込み防止のため一旦Usersを初期化する
      this.initUsersData();
      // resultsを元にユーザーデータを更新する
      this.updateUsersPersonality(results, keys);
      // ユーザーデータを元にグラフの描画を設定する
      this.updateChartJS(keys);

      this.waiting = false;
      this.showMaru = true;
    },
    async fetchValueToFirestore(keys){
      const targets = [];
      let temp = [];

      for (let i=this.showWeek; i > 0; i--) {
        const date = moment().add(-i, 'days').format('YYYY-MM-DD');
        for (let j=0; j < keys.length; j++) {
          temp[keys[j]] = { j, date };
        }
        targets[i] = temp;
        temp = {};
      }

      const results = await Promise.all(targets.map(async (data) => {
        const resultTemp = {};
        for (let i=0, obj=Object.keys(data); i < obj.length; i++) {
          resultTemp[obj[i]] = await this.DBProcess(data, obj[i]);
        }
        return resultTemp;
      }));

      return results;
    },
    updateUsersPersonality(results, keys){
      const len = keys.length;

      for (let i=this.showWeek; i > 0; i--) {
        const item = results[i];
        for (let j=0; j < len; j++) {
          this.users[keys[j]].date.push(moment(item[keys[j]].date).format('M/D'));
          this.users[keys[j]].weight.push(item[keys[j]].weight);
          this.users[keys[j]].fat.push(item[keys[j]].fat);
        }
      }
      // weight, fatに未入力項目があれば前後の値で補完する
      for (let i=0; i < len; i++) {
        this.users[keys[i]].weight = this.adjustIfValueIs(this.users[keys[i]].weight);
        this.users[keys[i]].fat = this.adjustIfValueIs(this.users[keys[i]].fat);
      }

      this.usersData({
        yoshida: this.users.yoshida,
        hirata: this.users.hirata,
        maruyama: this.users.maruyama,
      });
    },
    updateChartJS(keys){
      // toggleがActiveなユーザのチャートを表示する
      let active = Object.keys(this.currentToggle).filter(name => this.currentToggle[name] === true);

      // 一度もtoggleがtrueになってなければusersの0番目を表示する
      if (!active.length) active = keys;

      this.fillData({
        date: this.users[active[0]].date,
        weight: this.users[active[0]].weight,
        fat: this.users[active[0]].fat
      });
      this.chartData.weight.labels = this.users[active[0]].date;
      this.chartData.weight.datasets[0].data = this.users[active[0]].weight;
      this.chartData.fat.labels = this.users[active[0]].date;
      this.chartData.fat.datasets[0].data = this.users[active[0]].fat;
      this.toggle(active[0]);
    },
    initUsersData(){
      this.users = {
        yoshida: { date: [], weight: [], fat: [] },
        maruyama: { date: [], weight: [], fat: [] },
        hirata: { date: [], weight: [], fat: [] },
      };
    },
    adjustIfValueIs(data){
      // 空の配列が含まれていなければ処理中断
      if (data.indexOf('') === -1) {
        return data;
      }

      const filtered = [];
      const existConfirm = target => typeof target !== 'undefined' && target !== '';
      const tryValue = [-1, -2, -3, 1, 2, 3];

      data.filter((value, key, array) => {
        filtered[key] = value;

        if (value === '') {
          let adjust = '';

          for (let i=0, len=tryValue.length; i < len; i++) {
            if (existConfirm(array[key+tryValue[i]])) {
              adjust = array[key+tryValue[i]];
              break;
            }
          }

          filtered[key] = adjust;
        }
        return filtered[key];
      });

      return filtered;
    },
    DBProcess(data, name){
      const date = data[name].date;
      const todayDB = firestore.collection('users').doc(name).collection(date);
      const noData = { date, weight: '', fat: '' };

      return new Promise((resolve) => {
        if (typeof todayDB !== 'object') resolve(noData);

        todayDB.get().then((querySnapshot) => {
          if (querySnapshot.empty) resolve(noData);

          querySnapshot.forEach(doc => resolve(Object.assign(doc.data(), { date })));
        })
        .catch(error => resolve(console.error(`Error getting document: ${error}`)));
      });
    },
    nameConvert(user){
      let name = user;
      switch (name) {
        case 'yoshida': name = '吉田'; break;
        case 'hirata': name = '平田'; break;
        case 'maruyama': name = '丸山'; break;
        default: break;
      }
      return name;
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.idx {
  padding-top: 30px;
}
</style>
