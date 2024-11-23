import request from "../index.js";

export const reqMenuAPI = () => {
    return request({
        url: '/getMenu',
        method: 'get',
    })
}