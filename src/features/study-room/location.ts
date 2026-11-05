/** 自习室接口使用的定位参数（与小程序 currentLng/currentLat 一致） */
export interface StudyRoomLocation {
  currentLng?: number
  currentLat?: number
}

/** 定位成功后的缓存；页面间切换无需重复请求 */
let cached: StudyRoomLocation | undefined
/** 进行中的定位请求，避免并发重复调用 */
let pending: Promise<StudyRoomLocation> | undefined

/**
 * 获取当前用户的浏览器定位，作为自习室接口的 currentLng/currentLat 参数。
 *
 * 上游小程序接口按经纬度计算附近门店，缺少定位时部分接口会直接失败。
 * 定位不可用、被拒绝或超时时返回空对象，由调用方继续以无定位参数请求。
 */
export function getStudyRoomLocation(timeout = 8000): Promise<StudyRoomLocation> {
  if (cached) return Promise.resolve(cached)
  if (pending) return pending
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve({})
  pending = new Promise<StudyRoomLocation>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        cached = { currentLng: coords.longitude, currentLat: coords.latitude }
        pending = undefined
        resolve(cached)
      },
      () => {
        // 失败不缓存，用户稍后授予定位权限时仍可重新获取
        pending = undefined
        resolve({})
      },
      { enableHighAccuracy: false, timeout, maximumAge: 5 * 60 * 1000 },
    )
  })
  return pending
}
