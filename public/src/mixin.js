const env = require('../../.env');

export default {
  methods: {
    $_createdUsersData(values){
      // if (Object.keys(state.users).length) return;

      const defaultObject = typeof values === 'undefined'
        ? { date: [], weight: [], fat: [] }
        : values;
      const temp = {};

      Object.keys(env.USERS).forEach(key => Object.assign(temp, { [key]: defaultObject }));

      return temp;
    },
  }
};
