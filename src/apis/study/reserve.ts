import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/business/study/reserve'

/** @desc 我的预约列表（无分页） */
export function listStudyRoomUserReserve() {
  return http.get<T.StudyRoomUserReserveListResp>(`${BASE_URL}/user/list`)
}

/** @desc 取消预约前的提示 */
export function getStudyRoomReserveCancelTip(userReserveId: number) {
  return http.get<T.StudyRoomUserReserveCancelTipResp>(`${BASE_URL}/user/cancel/tip`, { userReserveId })
}

/** @desc 取消预约 */
export function cancelStudyRoomReserve(data: T.StudyRoomUserReserveCancelReq) {
  return http.post(`${BASE_URL}/user/cancel`, data)
}

/** @desc 预约资格校验 */
export function checkStudyRoomReserve() {
  return http.get<T.StudyRoomReserveCheckResp>(`${BASE_URL}/check`)
}
