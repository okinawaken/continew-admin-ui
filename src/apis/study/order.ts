import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/business/study/package'

/** @desc 我的订单 */
export function listStudyRoomOrder() {
  return http.get<T.StudyRoomUserOrderListResp>(`${BASE_URL}/user/order/list`)
}

/** @desc 微信支付状态查询 */
export function queryStudyRoomWxPayStatus(payId: number) {
  return http.post<T.StudyRoomWxPayQueryResp>(`${BASE_URL}/wx/query/status/${payId}`)
}
