<template>
  <div>
    <div class="form">
    	<ul class="form__ul">
    		<li class="form__li">
    			<strong class="form__head">入力者</strong>
    			<select id="js-fb-name" class="form__select" @change="changeConclusion">
            <option v-for="(key, id) in users" :key="id" :value="id" :selected="id === currentInputter">{{ key }}</option>
    			</select>
    		</li>

        <li class="form__li">
    			<strong class="form__head">日付</strong>
    			<select id="js-fb-date" class="form__select" @change="changeToSpecifiedDate">
    				<option v-for="key in date.list" :key="key.id" :value="key.value">{{ key.value }}</option>
    			</select>
    		</li>

    		<li class="form__li">
    			<strong class="form__head">{{ specified.text }}の体重
            <span class="form__head__changer" @click="changeInputMethod"
            data-value="weight">(入力を{{ currentMethod.weight.text }}に変える)</span>
          </strong>
          <select id="js-fb-weight" class="form__select" v-show="currentMethod.weight.method.select">
    				<option v-for="(key, id) in weight.list" :key="id" :value="key"
            :selected="key === Number(weight.value)">{{ key }}</option>
    			</select>
          <input id="js-fb-weight" type="number" class="form__input" placeholder="62.5"
          :value="Number(weight.value)" v-show="currentMethod.weight.method.input">
          <span class="form__notes">kg</span>
    		</li>

    		<li class="form__li">
    			<strong class="form__head">{{ specified.text }}の体脂肪率
            <span class="form__head__changer" @click="changeInputMethod"
            data-value="fat">(入力を{{ currentMethod.fat.text }}に変える)</span>
          </strong>
          <select id="js-fb-fat" class="form__select" v-show="currentMethod.fat.method.select">
            <option v-for="(key, id) in fat.list" :key="id" :value="key"
            :selected="key === Number(fat.value)">{{ key }}</option>
          </select>
          <input id="js-fb-fat" type="number" class="form__input" placeholder="20.0"
          :value="Number(fat.value)" v-show="currentMethod.fat.method.input">
          <span class="form__notes">%</span>
    		</li>
    	</ul>
    	<button id="submit" @click="databasePOST" class="button is-link"
      :class="{ 'is-loading': waiting }" :disabled="waiting">送信</button>

      <delete-settings class="form__del" :state="isState"></delete-settings>
    </div>
    <router-link to="/" tag="button" class="button is-info is-outlined">トップページへ戻る</router-link>

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
import DeleteSettings from '@/components/DeleteSettings';

window.moment = moment;

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
      waiting: false,
      isState: {
        confirm: false,
        error: false,
        loading: false,
        remove: false,
        show: false,
      },
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
      date: {
        value: moment().date(),
        list: [{
          id: 1,
          value: today,
        }],
      },
      weight: {
        value: 0,
        method: {
          input: false,
          select: true,
        },
        text: 'input',
        list: [],
      },
      fat: {
        value: 0,
        method: {
          input: false,
          select: true,
        },
        text: 'input',
        list: [],
      },
    };
  },
  components: { modal, DeleteSettings },
  computed: {
    ...mapGetters([
      'currentUsersData',
      'currentInputter',
      'currentMethod',
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
    const createDateList = () => {
      const inputLimit = -14;
      const array = [];
      const m = d => moment(today).add(d, 'days').format('YYYY-MM-DD');
      let id = 1;

      for (let i=0; i > inputLimit; i--) {
        array.push({ id, value: m(i) });
        id++;
      }
      this.date.list = array;
    };

    createDateList();
    this.createDisplayDefaultValue('weight', this.createFrontBehindValue);
    this.createDisplayDefaultValue('fat', this.createFrontBehindValue);
  },
  methods: {
    ...mapActions([
      'formInputter',
      'formMethod',
    ]),
    padding: number => String(number).padStart(2, '0'),
    createDisplayDefaultValue(value, callback){
      if (Object.keys(this.currentUsersData).length && this.currentInputter !== false) {
        const copyStateUser = Object.assign([], this.currentUsersData[this.currentInputter][value]);
        this[value].value = Number(copyStateUser.pop()).toFixed(1);

        if (typeof callback === 'function') callback(value);
      } else {
        this.isState.error = true;
      }
    },
    createFrontBehindValue(value){
      const array = [];
      const ref = Number(this[value].value);
      const range = 2;

      for (let i=Number(this[value].value); i > (ref-range);) {
        array.push(Number((i-0.1).toFixed(1)));
        i -= 0.1;
      }
      array.reverse().push(ref);
      for (let i=Number(this[value].value); i < (ref+range);) {
        array.push(Number((i+0.1).toFixed(1)));
        i += 0.1;
      }

      this[value].list = array;
    },
    changeToSpecifiedDate(event){
      this.specified.date = event.target.value;
    },
    changeConclusion(event){
      this.formInputter(event.target.value);
      this.createDisplayDefaultValue('weight', this.createFrontBehindValue);
      this.createDisplayDefaultValue('fat', this.createFrontBehindValue);
    },
    changeInputMethod(event){
      const val = event.target.dataset.value;
      const temp = {
        [val]: {
          text: this.currentMethod[val].text,
          method: {
            input: !this.currentMethod[val].method.input,
            select: !this.currentMethod[val].method.select,
          },
        },
      };
      const falsePosition = Object.values(temp[val].method).indexOf(false);
      temp[val].text = Object.keys(temp[val].method)[falsePosition];
      this.formMethod(temp);
    },

    databasePOST(){
      this.waiting = true;
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
        this.waiting = false;
        this.showModal = true;
      }).catch((error) => {
        this.waiting = false;
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
  &__ul {
    margin-bottom: 20px;
  }
  &__head {
    display: block;
    margin-bottom: 10px;
    line-height: 1;

    &__changer {
      display: inline-block;
      margin-left: 5px;
      color: $vue-color;
      font-size: 11px;
      text-decoration: underline;
    }
  }
  &__li {
    padding: 15px 10px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  &__select,
  &__input {
    padding: 4px 8px;
    font-size: 1rem;
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
    width: 120px;
    background-color: #fff;
  }
  &__input {
    width: 70px;
  }
  &__notes {
    margin-left: 5px;
    font-size: 10px;
  }
  &__del {
    margin: 20px 0 40px;
  }
}
</style>
