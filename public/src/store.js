import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
//
// const JSONC = require('json-cycle');

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    showUsers: false,
    isActive: {
      yoshida: false,
      hirata: false,
      maruyama: false,
    },
    users: {
      yoshida: { date: [], weight: [], fat: [] },
      maruyama: { date: [], weight: [], fat: [] },
      hirata: { date: [], weight: [], fat: [] },
    },
    chartData: {
      date: [],
      weight: [],
      fat: [],
    },
    formInputter: false,
  },
  mutations: {
    CHANGE_USERS(state, obj){
      // state.users = JSON.parse(JSON.stringify(Object.assign({}, state.users, obj)));
      state.users = Object.assign({}, state.users, obj);
      state.showUsers = true;
    },
    CHANGE_DATA(state, item){
      state.chartData.date = item.date;
      state.chartData.weight = item.weight;
      state.chartData.fat = item.fat;
    },
    CHANGE_TOGGLE(state, user){
      state.isActive = {
        yoshida: false,
        hirata: false,
        maruyama: false,
      };
      state.isActive[user] = true;
    },
    CHANGE_INPUTTER(state, user){
      state.formInputter = user;
    },
  },
  actions: {
    usersData: ({ commit }, obj) => commit('CHANGE_USERS', obj),
    fillData: ({ commit }, obj) => commit('CHANGE_DATA', obj),
    toggle: ({ commit }, user) => commit('CHANGE_TOGGLE', user),
    formInputter: ({ commit }, user) => commit('CHANGE_INPUTTER', user),
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
    currentInputter: state => state.formInputter,
  },
  plugins: [createPersistedState({
    key: 'marufes',
    paths: ['showUsers', 'isActive', 'users', 'chartData', 'formInputter'],
    // storage: {
    //   // getItem: key => JSONC.retrocycle(JSONC.parse(localStorage.getItem(key))),
    //   // setItem: (key, value) => localStorage.setItem(key, JSONC.stringify(JSONC.decycle(value))),
    //   getItem: async (key) => { await localStorage.getItem(key); },
    //   setItem: async (key, value) => { await localStorage.setItem(key, value); },
    //   removeItem: key => localStorage.removeItem(key),
    // },
  })],
});
