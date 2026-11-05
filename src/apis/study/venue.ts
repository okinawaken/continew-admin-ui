import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/business/study/venue'
const RESERVE_BASE_URL = '/business/study/reserve'

/** @desc 预约首页：banner、门店列表、区域筛选 */
export function getStudyRoomVenueIndex(query?: {
  currentLng?: number
  currentLat?: number
  venueName?: string
  channelBili?: number
  areaId?: number
}) {
  return http.get<T.StudyRoomReserveIndexResp>(`${BASE_URL}/reserve/index`, query)
}

/** @desc 门店详情 */
export function getStudyRoomVenueDetail(venueId: number) {
  return http.get<T.StudyRoomVenueDetailResp>(`${BASE_URL}/reserve/detail`, { venueId })
}

/** @desc 可预约日期列表 */
export function listStudyRoomReserveDate(venueId: number) {
  return http.get<T.StudyRoomReserveDateResp>(`${RESERVE_BASE_URL}/v2/date/select`, { venueId })
}
