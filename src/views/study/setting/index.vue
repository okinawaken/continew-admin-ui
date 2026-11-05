<template>
  <div class="gi_page">
    <a-alert v-if="loaded && !hasToken" type="warning" style="margin-bottom: 14px">
      尚未绑定小程序 token，绑定后才能查看和使用自习室功能。
    </a-alert>

    <a-row :gutter="14">
      <a-col :xs="24" :lg="16">
        <a-card :bordered="false" class="gi_card_title" title="自动化配置">
          <a-spin :loading="loading" style="display: block">
            <a-form
              ref="formRef"
              :model="form"
              :rules="rules"
              size="large"
              :layout="width >= 720 ? 'horizontal' : 'vertical'"
              auto-label-width
            >
              <a-form-item label="放号时刻" field="releaseTime">
                <a-time-picker
                  v-model="form.releaseTime"
                  format="HH:mm:ss"
                  placeholder="请选择放号时刻"
                  style="width: 100%"
                />
                <template #extra>
                  <span class="tip">默认 20:00；自动预约任务在放号后执行。</span>
                </template>
              </a-form-item>

              <a-form-item label="自动签到" field="signInEnable">
                <a-switch
                  v-model="form.signInEnable"
                  :checked-value="1"
                  :unchecked-value="0"
                  checked-text="开启"
                  unchecked-text="关闭"
                />
                <template #extra>
                  <span class="tip">开启后，预约成功且门店匹配时自动签到；关闭则只预约、不自动入场。</span>
                </template>
              </a-form-item>

              <a-form-item label="小程序 token" field="token">
                <div class="token-row">
                  <a-input-password
                    v-model="form.token"
                    :placeholder="hasToken ? '已绑定，粘贴新 token 可替换' : '请粘贴小程序 token'"
                    allow-clear
                  />
                  <a-tag :color="hasToken ? 'green' : 'gray'" size="small">
                    {{ hasToken ? '已绑定' : '未绑定' }}
                  </a-tag>
                </div>
                <template #extra>
                  <span class="tip">token 仅用于代理小程序接口，属于凭据；保存时会整体覆盖配置，留空表示保留当前绑定。</span>
                </template>
              </a-form-item>

              <a-form-item label="执行说明">
                <a-alert type="info">
                  自动预约任务在放号时刻由定时任务触发；也可在任务列表手动执行一次。保存时会以当前表单整体覆盖配置；小程序 token 留空表示保留当前绑定。
                </a-alert>
              </a-form-item>

              <div class="form-actions">
                <a-button :loading="loading" @click="load">刷新</a-button>
                <a-button type="primary" :loading="saving" @click="save">保存配置</a-button>
              </div>
            </a-form>
          </a-spin>
        </a-card>
      </a-col>

      <a-col :xs="24" :lg="8">
        <a-card :bordered="false" class="gi_card_title" title="当前账号">
          <a-spin :loading="userLoading" style="display: block">
            <div v-if="hasToken && canViewMiniUser" class="account-head">
              <Avatar :src="miniUser?.headImg" :name="accountName" :size="48" />
              <div class="account-main">
                <div class="account-name">{{ accountName }}</div>
                <div class="account-sub">{{ miniUser?.mobile || '—' }}</div>
              </div>
            </div>
            <a-empty v-else :description="accountEmptyText" />
          </a-spin>

          <a-descriptions v-if="hasToken && canViewMiniUser" :column="1" size="medium" style="margin-top: 14px">
            <a-descriptions-item label="微信昵称">
              {{ miniUser?.nickName || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="真实姓名">
              {{ miniUser?.userName || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="手机号">
              {{ miniUser?.mobile || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="累计签到">
              {{ miniUser?.signTotalNum ?? 0 }} 次
            </a-descriptions-item>
            <a-descriptions-item label="累计学习">
              {{ miniUser?.studyTotalTimeStr || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="绑定状态">
              <a-tag :color="hasToken ? 'green' : 'gray'" size="small">
                {{ hasToken ? '已绑定小程序' : '未绑定小程序' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="放号时刻">
              {{ form.releaseTime || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="自动签到">
              {{ form.signInEnable === 1 ? '开启' : '关闭' }}
            </a-descriptions-item>
          </a-descriptions>
          <a-alert type="info" style="margin-top: 12px">
            token 失效时接口返回 40102，重新粘贴有效 token 即可恢复。
          </a-alert>
        </a-card>

        <a-card :bordered="false" class="gi_card_title danger-card" title="危险操作" style="margin-top: 14px">
          <p class="danger-desc">
            解绑后 token 会被清空，放号时刻与自动签到开关保留；自动预约与自动签到不再执行，历史任务与执行记录保留。
          </p>
          <a-button status="danger" :disabled="!hasToken" :loading="saving" @click="unbind">
            解除授权
          </a-button>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance } from '@arco-design/web-vue'
import { Message, Modal } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { getStudyRoomUserIndex, getStudyRoomUserSetting, updateStudyRoomUserSetting } from '@/apis/study'
import type { StudyRoomUserIndexResp, StudyRoomUserSettingReq } from '@/apis/study/type'
import { useStudyRoomToken } from '@/features/study-room'
import { useUserStore } from '@/stores'
import has from '@/utils/has'

defineOptions({ name: 'StudyRoomSetting' })

/** 查看小程序账号信息所需的权限标识（与后端 /business/study/user/index 一致） */
const USER_INFO_READ_PERMISSION = 'business:study:user:list'

const { width } = useWindowSize()
const userStore = useUserStore()
const { markBound } = useStudyRoomToken()
const formRef = ref<FormInstance>()

const loading = ref(false)
const loaded = ref(false)
const saving = ref(false)
const hasToken = ref(false)
const userLoading = ref(false)
/** 当前绑定 token 对应的小程序账号信息 */
const miniUser = ref<StudyRoomUserIndexResp>()
const canViewMiniUser = has.hasPerm(USER_INFO_READ_PERMISSION)
const accountName = computed(() => miniUser.value?.nickName || miniUser.value?.userName || '未获取到昵称')
const accountEmptyText = computed(() => {
  if (!hasToken.value) return '尚未绑定小程序 token，绑定后展示小程序账号信息'
  if (!canViewMiniUser) return '暂无查看小程序账号信息的权限'
  return '暂未获取到小程序账号信息'
})
/** 已保存的配置，与后端 config 结构一致；全量更新时整体提交，token 留空则回填 */
const config = ref<Required<StudyRoomUserSettingReq>>({
  releaseTime: '20:00:00',
  signInEnable: 0,
  token: '',
})

const form = reactive({
  releaseTime: '20:00:00',
  signInEnable: 0,
  token: '',
})

const rules = {
  releaseTime: [{ required: true, message: '请选择放号时刻' }],
}

function normalizeTime(value?: string) {
  if (!value) return ''
  const [hour = '00', minute = '00', second = '00'] = value.split(':')
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`
}

/** 加载当前绑定的小程序账号信息；未绑定、无权限或 token 失效时保持为空 */
async function loadMiniUser() {
  if (!hasToken.value || !canViewMiniUser) {
    miniUser.value = undefined
    return
  }
  userLoading.value = true
  try {
    const { data } = await getStudyRoomUserIndex()
    miniUser.value = data ?? undefined
  } catch {
    miniUser.value = undefined
  } finally {
    userLoading.value = false
  }
}

async function load() {
  const userId = userStore.userInfo.id
  if (!userId) return
  loading.value = true
  try {
    const { data } = await getStudyRoomUserSetting(userId)
    const dataConfig = data?.config ?? {}
    config.value = {
      releaseTime: normalizeTime(dataConfig.releaseTime || '20:00:00'),
      signInEnable: dataConfig.signInEnable ?? 0,
      token: dataConfig.token || '',
    }
    form.releaseTime = config.value.releaseTime
    form.signInEnable = config.value.signInEnable
    hasToken.value = Boolean(config.value.token)
    // 同步自习室模块的绑定缓存，绑定后无需再次检测即可进入其他自习室页面
    markBound(hasToken.value)
    loaded.value = true
    form.token = ''
    await loadMiniUser()
  } finally {
    loading.value = false
  }
}

async function save() {
  const userId = userStore.userInfo.id
  if (!userId) {
    Message.warning('当前登录用户信息尚未加载')
    return
  }
  const invalid = await formRef.value?.validate()
  if (invalid) return
  const payload: StudyRoomUserSettingReq = {
    releaseTime: normalizeTime(form.releaseTime),
    signInEnable: form.signInEnable,
    // 后端为全量更新，token 留空时回填已保存的 token，避免误清绑定
    token: form.token.trim() || config.value.token,
  }
  saving.value = true
  try {
    await updateStudyRoomUserSetting(payload, userId)
    Message.success('配置已保存')
    form.token = ''
    await load()
  } finally {
    saving.value = false
  }
}

function unbind() {
  const userId = userStore.userInfo.id
  if (!userId) return
  Modal.warning({
    title: '解除小程序授权',
    content: '解绑后自动预约与自动签到将停止，历史任务与记录保留。确定解绑？',
    okButtonProps: { status: 'danger' },
    hideCancel: false,
    maskClosable: false,
    onBeforeOk: async () => {
      saving.value = true
      try {
        // 后端为全量更新，解绑时带回已保存的配置，只清空 token
        await updateStudyRoomUserSetting({ ...config.value, token: '' }, userId)
        Message.success('已解除授权')
        await load()
        return true
      } finally {
        saving.value = false
      }
    },
  })
}

onMounted(load)
</script>

<style scoped lang="scss">
.tip {
  color: var(--color-text-3);
  font-size: 12px;
}

.account-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-name {
  color: var(--color-text-1);
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
}

.account-sub {
  margin-top: 2px;
  color: var(--color-text-3);
  font-size: 12px;
}

.token-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  .arco-input-password {
    flex: 1;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.danger-desc {
  margin: 0 0 12px;
  color: var(--color-text-2);
  font-size: 13px;
  line-height: 1.6;
}
</style>
