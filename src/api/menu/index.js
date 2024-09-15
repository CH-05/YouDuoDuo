import request from "../index.js";

export const reqMenu = () => {
    return request({
        url: '/menu',
        method: 'get',
    })
}