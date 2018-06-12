import Vue from 'vue';
import Vuex from 'vuex';
import mixin from '@/mixin';
import createPersistedState from 'vuex-persistedstate';

Vue.use(Vuex);

const env = require('../../.env');

const initialState = {
  showUsers: false,
  isActive: {},
  users: {},
  chartData: {
    date: [],
    weight: [],
    fat: [],
  },
  lastUpdate: null,
  form: {
    inputter: Object.keys(env.USERS)[0],
    weight: {
      text: 'input',
      method: {
        input: false,
        select: true,
      },
    },
    fat: {
      text: 'input',
      method: {
        input: false,
        select: true,
      },
    },
  },
};

export default new Vuex.Store({
  state: Object.assign({}, initialState),
  mutations: {
    CHANGE_USERS(state, obj){
      if (!Object.keys(state.users).length) {
        state.users = mixin.methods.$_createdUsersData();
        state.users = obj;
      } else {
        state.users = obj;
      }

      if (!Object.keys(state.users).length) return;

      state.showUsers = true;
    },
    CHANGE_DATA(state, item){
      state.chartData.date = item.date;
      state.chartData.weight = item.weight;
      state.chartData.fat = item.fat;
    },
    CHANGE_TOGGLE(state, user){
      state.isActive = mixin.methods.$_createdUsersData(false);
      state.isActive[user] = true;
    },
    CHANGE_LASTUPDATE(state, date){
      state.lastUpdate = date;
    },
    CHANGE_INPUTTER(state, user){
      state.form.inputter = user;
    },
    CHANGE_INPUT_METHOD(state, method){
      Object.assign(state.form, method);
    },
    CLEAR_STATE(state){
      Object.assign(state, initialState);
    },
  },
  actions: {
    usersData: ({ commit }, obj) => commit('CHANGE_USERS', obj),
    fillData: ({ commit }, obj) => commit('CHANGE_DATA', obj),
    toggle: ({ commit }, user) => commit('CHANGE_TOGGLE', user),
    lastUpdate: ({ commit }, date) => commit('CHANGE_LASTUPDATE', date),
    formInputter: ({ commit }, user) => commit('CHANGE_INPUTTER', user),
    formMethod: ({ commit }, method) => commit('CHANGE_INPUT_METHOD', method),
    clearState: ({ commit }) => commit('CLEAR_STATE'),
  },
  getters: {
    currentShowUsers: state => state.showUsers,
    currentUsersData: state => state.users,
    currentChartData: state => ({
      weight: {
        labels: state.chartData.date,
        datasets: [{
          label: '体重',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'white',
          borderWidth: 2,
          pointBorderColor: '#42b983',
          data: state.chartData.weight,
        }],
      },
      fat: {
        labels: state.chartData.date,
        datasets: [{
          label: '体脂肪率',
          backgroundColor: 'transparent',
          pointBackgroundColor: 'white',
          borderWidth: 2,
          pointBorderColor: '#83b9b9',
          data: state.chartData.fat
        }],
      }
    }),
    currentToggle: state => state.isActive,
    currentLastUpdate: state => state.lastUpdate,
    currentInputter: state => state.form.inputter,
    currentMethod: state => state.form,
  },
  plugins: [createPersistedState({
    key: env.LOCAL_STORAGE_NAME,
    paths: [
      'showUsers',
      'isActive',
      'users',
      'chartData',
      'form',
      'lastUpdate',
    ],
  })],
});
