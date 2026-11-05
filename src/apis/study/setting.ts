import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/business/study/user-setting'

/** @desc 查询当前用户的自习室配置 */
export function getStudyRoomUserSetting(userId: string) {
  return http.get<T.StudyRoomUserSettingResp>(`${BASE_URL}/${userId}`)
}

/** @desc 更新当前用户的自习室配置（全量更新，需提交完整配置） */
export function updateStudyRoomUserSetting(data: T.StudyRoomUserSettingReq, userId: string) {
  return http.put(`${BASE_URL}/${userId}`, data)
}
