import axios from 'axios'
// 配置API接口地址
const axio = new axios.create({
    baseURL: process.env.API_ROOT,
    timeout: 1000
});

export {axio as ajax}