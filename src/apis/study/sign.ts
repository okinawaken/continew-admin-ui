import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/business/study/sign'
const USER_BASE_URL = '/business/study/user'

/** @desc 签到首页：当前在座、附近门店、统计信息 */
export function getStudyRoomIndex(query?: { currentLng?: number, currentLat?: number, venueId?: number, bssid?: string, ssid?: string }) {
  return http.get<T.StudyRoomIndexResp>(`${BASE_URL}/index`, query)
}

/** @desc 历史签到记录（最近 N 条） */
export function listStudyRoomUserSign(id = 0) {
  return http.get<T.StudyRoomUserSignListResp>(`${USER_BASE_URL}/sign/list`, { id })
}

/** @desc 更早的签到记录 */
export function listStudyRoomUserSignMore() {
  return http.get<T.StudyRoomUserSignListResp>(`${USER_BASE_URL}/sign/list/more`)
}

/** @desc 签到选座座位图 */
export function listStudyRoomSignSeat(data: T.StudyRoomSignSeatQueryReq) {
  return http.post<T.StudyRoomSignSeatListResp>(`${BASE_URL}/seat/list`, data)
}

/** @desc 换座座位图 */
export function listStudyRoomChangeSeat(data: T.StudyRoomChangeSeatReq) {
  return http.post<T.StudyRoomSignSeatMapResp>(`${BASE_URL}/change/seat/list`, data)
}

/** @desc 签退可选结算套餐 */
export function listStudyRoomSettlePackage(data: T.StudyRoomSettlementReq) {
  return http.post<T.StudyRoomSettlePackageResp[]>(`${BASE_URL}/settle-package/select`, data)
}

/** @desc 是否可再签一个座位 */
export function checkStudyRoomSignAnother(venueId: number) {
  return http.get<T.StudyRoomSignAnotherCheckResp>(`${BASE_URL}/another/check`, { venueId })
}

/** @desc 扫码签退 */
export function studyRoomSignOut(data: T.StudyRoomSignOutReq) {
  return http.post<T.StudyRoomSignOutResp>(`${BASE_URL}/out`, data)
}

/** @desc 学习排行榜 */
export function getStudyRoomRank(data: { venueId?: number, rankType?: number }) {
  return http.post<T.StudyRoomRankResp>(`${BASE_URL}/rank/index`, data)
}

/** @desc 签到选座确认 */
export function confirmStudyRoomSeat(data: T.StudyRoomSeatConfirmReq) {
  return http.post<T.StudyRoomSeatConfirmResp>(`${BASE_URL}/seat/confirm`, data)
}

/** @desc 换座确认 */
export function confirmStudyRoomChangeSeat(data: T.StudyRoomChangeSeatConfirmReq) {
  return http.post<T.StudyRoomChangeSeatConfirmResp>(`${BASE_URL}/change/seat/confirm`, data)
}

/** @desc 进入签退结算 */
export function getStudyRoomSettlement(data: T.StudyRoomSettlementReq) {
  return http.post<T.StudyRoomSettlementResp>(`${BASE_URL}/settlement`, data)
}

/** @desc 确认签退结算套餐 */
export function confirmStudyRoomUserPackage(data: T.StudyRoomUserPackageConfirmReq) {
  return http.post<T.StudyRoomUserPackageConfirmResp>(`${BASE_URL}/user-package/confirm`, data)
}

/** @desc 座位灯控 */
export function turnStudyRoomLight(data: T.StudyRoomEspLightTurnReq) {
  return http.post(`${BASE_URL}/esp-light/turn`, data)
}

/** @desc 门店门禁区域列表 */
export function listStudyRoomGuard(venueId: number) {
  return http.get<T.StudyRoomGuardListResp>('/business/study/guard/select', { venueId })
}

/** @desc 门禁开门 */
export function openStudyRoomGuard(data: T.StudyRoomGuardOpenReq) {
  return http.post('/business/study/guard/open', data)
}
