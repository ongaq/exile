<template>
  <div>
    <div class="form">
    	<ul class="form__ul">
    		<li class="form__li">
    			<strong class="form__head">入力者</strong>
    			<select id="js-fb-name" class="form__select" @change="changeToInputter">
            <option v-for="(key, id) in users" :key="id" :value="id" :selected="id === currentInputter">{{ key }}</option>
    			</select>
    		</li>
        <li class="form__li">
    			<strong class="form__head">日付</strong>
    			<select id="js-fb-date" class="form__select" @change="changeToSpecifiedDate">
    				<option v-for="key in dates" :key="key.id" :value="key.value">{{ key.value }}</option>
    			</select>
    		</li>
    		<li class="form__li">
    			<strong class="form__head">{{ specified.text }}の体重</strong>
    			<input id="js-fb-weight" type="number" class="form__input" placeholder="62.5"><span class="form__notes">kg</span>
    		</li>
    		<li class="form__li">
    			<strong class="form__head">{{ specified.text }}の体脂肪率</strong>
    			<input id="js-fb-fat" type="number" class="form__input" placeholder="20.0"><span class="form__notes">%</span>
    		</li>
    	</ul>
    	<button id="submit" @click="databasePOST" class="button button--large">送信</button>
    </div>
    <router-link to="/" tag="button" class="button button--large">トップページへ戻る</router-link>

  	<!-- Modal -->
  	<modal v-if="showModal" @close="showModal = false">
  		<h3 slot="header">以下の内容を記録しました</h3>
  		<div slot="body">
  			日付: {{ param.date }}<br>
  			名前: {{ param.name }}<br>
  			体重: {{ param.weight }}kg<br>
  			体脂肪率: {{ param.fat }}%
  		</div>
  	</modal>
  	<modal v-if="showError" @close="showError = false">
  		<h3 slot="header">項目を全て入力して下さい</h3>
  	</modal>
  </div>
</template>

<script>
import * as firebase from 'firebase';
import * as moment from 'moment';
import { mapGetters, mapActions } from 'vuex';
import modal from '@/components/modal';

const env = require('../../../.env');
require('firebase/app');
require('firebase/firestore');

const today = moment().format('YYYY-MM-DD');

export default {
  name: 'dataForm',
  data() {
    return {
      showModal: false,
      showError: false,
      param: {
        date: null,
        name: null,
        weight: null,
        fat: null,
      },
      specified: {
        date: today,
        text: '今日',
      },
      users: env.USERS,
      date: moment().date(),
      dates: [{
        id: 1,
        value: today,
      }],
    };
  },
  components: { modal },
  computed: {
    ...mapGetters([
      'currentInputter'
    ])
  },
  watch: {
    showModal(newValue){
      this.modalEvent(newValue);
    },
    specified: {
      handler(newValue){
        this.specified.text = today === newValue.date
        ? '今日'
        : moment(newValue.date).format('M/D');
      },
      deep: true,
    },
  },
  created(){
    const inputLimit = this.date - 14;
    const array = [];
    const year = moment().year();
    const month = moment().month()+1;
    let id = 1;

    for (let i=this.date; i > inputLimit; i--) {
      const value = `${year}-${this.padding(month)}-${this.padding(i)}`;
      array.push({ id, value });
      id++;
    }
    this.dates = array;
  },
  methods: {
    ...mapActions([
      'formInputter'
    ]),
    padding: number => String(number).padStart(2, '0'),
    changeToInputter(event){
      this.formInputter(event.target.value);
    },
    changeToSpecifiedDate(event){
      this.specified.date = event.target.value;
    },
    databasePOST(){
      const DB = firebase.firestore();
      const date = this.specified.date;
      const weight = document.getElementById('js-fb-weight').value;
      const fat = document.getElementById('js-fb-fat').value;
      const selectName = document.getElementById('js-fb-name');
      const name = selectName.options[selectName.selectedIndex].text;

      if (fat.length === 0 || weight.length === 0) {
        this.showError = true;
        return;
      }
      this.param = { date, name, weight, fat };

      DB.collection('users').doc(selectName.value).collection(date).add({
        weight, fat,
      }).then(() => {
        this.showModal = true;
      }).catch((error) => {
        console.error('Error adding document: ', error);
      });
    },
    modalEvent(_newValue){
      if (!_newValue) {
        this.$router.push({ path: '/' });
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
$vue-color: #42b983;

.form {
  margin-bottom: 50px;

  &__ul {
    margin-bottom: 20px;
  }
  &__head {
    display: block;
    margin-bottom: 10px;
    line-height: 1;
  }
  &__li {
    padding: 15px 10px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  &__select,
  &__input {
    padding: 4px 8px;
    width: 70px;
    border: 1px solid #f0f0f0;
    border-radius: 3px;
    transition: box-shadow 0.3s ease;
    box-shadow: 0 0 3px #fff;

    &:focus {
      border-color: $vue-color;
      box-shadow: 0 0 3px $vue-color;
    }
  }
  &__select,
  &__input {
    appearance: none;
  }
  &__select {
    width: 100px;
    background-color: #fff;
  }
  &__input {

  }
  &__notes {
    margin-left: 5px;
    font-size: 10px;
  }
}
</style>
