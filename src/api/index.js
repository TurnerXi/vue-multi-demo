import {ajax} from './base.js'
export default{
//    http://cp.lemicp.com/api/data?key=503000&t_from=0&p_from=0&position=300
    index_oper_banner () {
        return ajax.get("/api/data",{
            params: {
                key: 503000,
                position: 300,
                t_from: 0,
                p_from: 0
            }
        });
    }
}