import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/business/study/misc'

/** @desc 门店储物柜列表 */
export function listStudyRoomCabinet(venueId: number) {
  return http.get<T.StudyRoomCabinetVenueListResp>(`${BASE_URL}/cabinet/venue/list`, { venueId })
}

/** @desc 柜体格口列表 */
export function listStudyRoomCabinetGrid(cabinetId: number) {
  return http.get<T.StudyRoomCabinetGridListResp>(`${BASE_URL}/cabinet/grid/list`, { cabinetId })
}

/** @desc 柜格定价 */
export function getStudyRoomCabinetGridPrice(gridId: number) {
  return http.get<T.StudyRoomCabinetGridPriceResp>(`${BASE_URL}/cabinet/grid/price`, { gridId })
}

/** @desc 我当前已租的柜格 */
export function listStudyRoomUserGrid(venueId: number) {
  return http.get<T.StudyRoomCabinetUserGridListResp>(`${BASE_URL}/cabinet/user/grid/list`, { venueId })
}

/** @desc 储物柜租赁订单 */
export function listStudyRoomCabinetLeaseOrder() {
  return http.post<T.StudyRoomCabinetLeaseOrderListResp>(`${BASE_URL}/cabinet/lease/order/list`)
}

/** @desc 储物柜开锁 */
export function openStudyRoomCabinet(data: T.StudyRoomCabinetWifiOpenReq) {
  return http.post(`${BASE_URL}/cabinet/wifi/open`, data)
}

/** @desc 储物柜自动退租 */
export function autoCheckoutStudyRoomCabinet(lastLeaseId: number) {
  return http.get(`${BASE_URL}/cabinet/lease/auto-checkout`, { lastLeaseId })
}
