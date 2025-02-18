import request from "../../utils/request";

export const reqMenuAPI = () => {
    return request({
        url: '/getMenu',
        method: 'get',
    })
}