import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/business/study/repair'

/** @desc 报修列表 */
export function listStudyRoomRepair() {
  return http.get<T.StudyRoomRepairListResp>(`${BASE_URL}/list`)
}

/** @desc 报修详情 */
export function getStudyRoomRepair(id: number) {
  return http.get<T.StudyRoomRepairResp>(`${BASE_URL}/detail/${id}`)
}

/** @desc 提交报修 */
export function submitStudyRoomRepair(data: T.StudyRoomRepairSubmitReq) {
  return http.post(`${BASE_URL}/submit`, data)
}
