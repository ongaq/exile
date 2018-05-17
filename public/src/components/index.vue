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
      date: moment().format('YYYY-MM-DD'),
      DB: firebase.firestore(),
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
      const usersLen = keys.length;
      const showWeek = 14;

      // this.currentShowUsersはbool値ではなく、
      // 取得データの最終日を保存しておき、本日のnew Dateと比較するのがいいかも？
      // if (!this.currentShowUsers) {
      for (let i=showWeek; i > 0; i--) {
        this.updateDate(-i);
        for (let j=0; j < usersLen; j++) {
          await this.updateUsersPersonality(keys, j);
        }
      }
      // weight, fatに未入力項目があれば前後の値で補完する
      for (let i=0; i < usersLen; i++) {
        this.users[keys[i]].weight = this.adjustIfValueIs(this.users[keys[i]].weight);
        this.users[keys[i]].fat = this.adjustIfValueIs(this.users[keys[i]].fat);
      }
      // }
      // const transferData = JSON.parse(JSON.stringify({
      //   yoshida: this.users.yoshida,
      //   hirata: this.users.hirata,
      //   maruyama: this.users.maruyama,
      // }));
      this.usersData({
        yoshida: this.users.yoshida,
        hirata: this.users.hirata,
        maruyama: this.users.maruyama,
      });

      // usersの0番目を表示する初期設定
      this.fillData({
        date: this.users[keys[0]].date,
        weight: this.users[keys[0]].weight,
        fat: this.users[keys[0]].fat
      });
      this.chartData.weight.labels = this.users[keys[0]].date;
      this.chartData.weight.datasets[0].data = this.users[keys[0]].weight;
      this.chartData.fat.labels = this.users[keys[0]].date;
      this.chartData.fat.datasets[0].data = this.users[keys[0]].fat;

      this.toggle(keys[0]);

      this.waiting = false;
      this.showMaru = true;
    },
    async updateUsersPersonality(usersArray, num){
      const user = this.users[usersArray[num]];
      const data = await this.databaseGET(usersArray[num], this.date);
      user.date.push(moment(data.date).format('M/D'));
      user.weight.push(data.weight);
      user.fat.push(data.fat);
    },
    updateDate(date){
      this.date = moment().add(date, 'days').format('YYYY-MM-DD');
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
    databaseGET(name, date){
      const todayDB = this.DB.collection('users').doc(name).collection(date);
      const noData = { date, weight: '', fat: '' };

      return new Promise((resolve) => {
        if (typeof todayDB !== 'object') resolve(noData);

        todayDB.get()
        .then((querySnapshot) => {
          if (querySnapshot.empty) resolve(noData);

          querySnapshot.forEach(doc => resolve(Object.assign(doc.data(), { date })));
        })
        .catch(error => resolve(console.error(`Error getting document: ${error}`)));
      });
    },
    nameConvert(user){
      let name = user;

      if (name === 'yoshida') name = '吉田';
      else if (name === 'hirata') name = '平田';
      else if (name === 'maruyama') name = '丸山';

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
