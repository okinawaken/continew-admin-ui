import { Message } from '@arco-design/web-vue'
import type { Router } from 'vue-router'
import { useStudyRoomToken } from './token'
import { getAccessToken } from '@/features/auth-session/access-token'

/** 自习室模块根路径（与后端菜单一致） */
const STUDY_ROOM_ROOT = '/study'
/** 用户设置页路径；动态路由未生成时作为回退值 */
const STUDY_ROOM_SETTING_PATH = '/study/setting'

const isStudyRoomPath = (path: string) => path === STUDY_ROOM_ROOT || path.startsWith(`${STUDY_ROOM_ROOT}/`)

/** 用户设置页路由由后端菜单下发，优先按路由名解析，避免路径调整后引导失效 */
const resolveSettingPath = (router: Router) => {
  return router.getRoutes().find((route) => route.name === 'StudySetting')?.path || STUDY_ROOM_SETTING_PATH
}

/**
 * 进入自习室页面时检测小程序 token，未绑定则引导到用户设置页。
 *
 * 必须注册在认证路由守卫之后：首次访问时需等待动态路由生成，
 * 再按路由名解析用户设置页地址。
 */
export const setupStudyRoomGuard = (router: Router) => {
  router.beforeEach(async (to) => {
    // 404 等无名路由不处理，避免把误访问也重定向到用户设置页
    if (!to.name || !isStudyRoomPath(to.path)) return
    if (to.name === 'StudySetting' || to.path === resolveSettingPath(router)) return
    // 未登录由认证守卫处理，这里只判断小程序账号绑定状态
    if (!getAccessToken()) return
    const { check } = useStudyRoomToken()
    const bound = await check()
    // undefined 表示检测失败，无法判断，放行以避免误拦截
    if (bound !== false) return
    Message.warning('尚未绑定自习室小程序 token，请先在「用户设置」中完成绑定')
    return { path: resolveSettingPath(router), replace: true }
  })
}
