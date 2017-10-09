import Vue from 'vue'
import Index from './index.vue'
import VueResource from 'vue-resource'
import api from '@/api/index.js'
Vue.use(VueResource);

new Vue({
  render: h => h(Index)
  ,
  mounted: function(){
    console.log(process.env.NODE_ENV);
    api.index_oper_banner(this).then(function(data,err){
        console.log(data.data);
    })
  }
}).$mount('#app')
