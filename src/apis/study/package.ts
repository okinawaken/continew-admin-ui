import type * as T from './type'
import http from '@/utils/http'

const BASE_URL = '/business/study/package'

/** @desc 套餐列表（v2） */
export function listStudyRoomPackage(data: T.StudyRoomBuyV2PackageListReq) {
  return http.post<T.StudyRoomBuyV2PackageListResp>(`${BASE_URL}/v2/list`, data)
}

/** @desc 套餐筛选项 */
export function getStudyRoomPackageOpt(query?: { currentLng?: number, currentLat?: number }) {
  return http.get<T.StudyRoomBuyV2PackageOptResp>(`${BASE_URL}/v2/opt-list`, query)
}

/** @desc 套餐标签 / 座位区域筛选项 */
export function listStudyRoomPackageLabel(venueId: number) {
  return http.get<T.StudyRoomBuyV2PackageLabelResp>(`${BASE_URL}/v2/label/select-list`, { venueId })
}

/** @desc 套餐详情（v2） */
export function getStudyRoomPackageDetail(packageId: number) {
  return http.get<T.StudyRoomBuyV2PackageDetailResp>(`${BASE_URL}/v2/detail/${packageId}`)
}
