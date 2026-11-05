import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/business/study/auto-reserve/task/record'

/** @desc 查询自动预约执行记录 */
export function listStudyRoomTaskRecord(query: T.StudyRoomAutoReserveTaskRecordQuery) {
  return http.get<PageRes<T.StudyRoomAutoReserveTaskRecordResp[]>>(BASE_URL, query)
}
