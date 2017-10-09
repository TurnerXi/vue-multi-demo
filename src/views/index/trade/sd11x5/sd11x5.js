import Vue from 'vue'
import Index from './sd11x5.vue'
import VueResource from 'vue-resource'
import api from '@/api/index.js'
Vue.use(VueResource);

new Vue({
  render: h => h(Index)
  ,
  mounted: function(){
        api.index_oper_banner(this).then(function(data,err){
            console.log(data.data);
        })
  }
}).$mount('#app')
