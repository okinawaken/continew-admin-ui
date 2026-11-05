import { ref } from 'vue'
import { getStudyRoomUserSetting } from '@/apis/study'
import { useUserStore } from '@/stores'
import has from '@/utils/has'

/** 读取自习室用户设置的权限标识（与后端菜单一致） */
const STUDY_ROOM_SETTING_READ_PERMISSION = 'business:studyUser-setting:get'

/** 小程序 token 绑定状态；undefined 表示尚未检测成功 */
const bound = ref<boolean>()
/** 当前缓存对应的系统用户，切换账号后需重新检测 */
let boundUserId: string | undefined
/** 进行中的检测请求，避免并发重复调用 */
let pending: Promise<boolean | undefined> | undefined

/**
 * 自习室小程序 token 绑定状态。
 *
 * 自习室各页面均通过后端代理小程序接口，未绑定 token 时接口无法正常返回，
 * 因此进入自习室模块前需要先确认绑定状态。
 */
export function useStudyRoomToken() {
  const userStore = useUserStore()

  /**
   * 检测当前用户是否已绑定小程序 token。
   *
   * @param force 是否忽略缓存强制重新检测
   * @returns true 已绑定 / false 未绑定 / undefined 检测失败（无法判断）
   */
  async function check(force = false): Promise<boolean | undefined> {
    const userId = userStore.userInfo.id
    if (!userId) {
      bound.value = undefined
      return undefined
    }
    // 无读取配置权限时无法判断绑定状态，也无法进入用户设置页，直接跳过
    if (!has.hasPerm(STUDY_ROOM_SETTING_READ_PERMISSION)) {
      bound.value = undefined
      return undefined
    }
    if (boundUserId !== userId) {
      bound.value = undefined
      pending = undefined
      boundUserId = userId
    }
    if (!force) {
      if (bound.value !== undefined) return bound.value
      if (pending) return pending
    }
    pending = getStudyRoomUserSetting(userId)
      .then(({ data }) => Boolean(data?.config?.token))
      // 查询失败（网络异常、无权限等）时保持未知，避免把检测失败误判为未绑定
      .catch(() => undefined)
      .then((value) => {
        bound.value = value
        pending = undefined
        return value
      })
    return pending
  }

  /** 设置页保存 / 解绑后同步缓存，避免下次进入自习室页面时重复检测 */
  function markBound(value: boolean) {
    bound.value = value
    boundUserId = userStore.userInfo.id || undefined
  }

  return { bound, check, markBound }
}
