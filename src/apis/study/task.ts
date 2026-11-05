import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/business/study/auto-reserve/task'

/** @desc 查询自动预约任务列表 */
export function listStudyRoomTask(query: T.StudyRoomAutoReserveTaskQuery) {
  return http.get<PageRes<T.StudyRoomAutoReserveTaskResp[]>>(BASE_URL, query)
}

/** @desc 查询自动预约任务详情 */
export function getStudyRoomTask(id: number) {
  return http.get<T.StudyRoomAutoReserveTaskResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增自动预约任务 */
export function addStudyRoomTask(data: T.StudyRoomAutoReserveTaskReq) {
  return http.post(BASE_URL, data)
}

/** @desc 修改自动预约任务 */
export function updateStudyRoomTask(data: T.StudyRoomAutoReserveTaskReq, id: number) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除自动预约任务 */
export function deleteStudyRoomTask(id: number) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 暂停自动预约任务 */
export function pauseStudyRoomTask(id: number) {
  return http.post(`${BASE_URL}/${id}/pause`)
}

/** @desc 恢复自动预约任务 */
export function resumeStudyRoomTask(id: number) {
  return http.post(`${BASE_URL}/${id}/resume`)
}

/** @desc 立即执行一次自动预约任务 */
export function executeStudyRoomTask(id: number) {
  return http.post(`${BASE_URL}/${id}/execute`)
}
