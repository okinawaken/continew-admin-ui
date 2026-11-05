import type * as T from './type'
import http from '@/utils/http'

/** @desc 预约可选门店列表 */
export function listStudyRoomVenue() {
  return http.get<T.StudyRoomVenueSelectResp>('/business/study/venue/reserve/select')
}

/** @desc 区域筛选项 */
export function listStudyRoomArea() {
  return http.get<T.StudyRoomAreaSelectResp>('/business/study/venue/reserve/area/select')
}

/** @desc 座位图（v2） */
export function listStudyRoomSeat(data: T.StudyRoomSeatQueryReq) {
  return http.post<T.StudyRoomSeatMapResp>('/business/study/reserve/v2/seat/list', data)
}
