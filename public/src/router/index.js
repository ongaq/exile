import Vue from 'vue';
import Router from 'vue-router';
import index from '@/components/index';
import form from '@/components/form';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'index',
      component: index,
    },
    {
      path: '/form',
      name: 'dataForm',
      component: form,
    },
  ],
});
