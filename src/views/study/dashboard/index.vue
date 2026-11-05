<template>
  <div class="gi_page">
    <div class="page-head">
      <div>
        <h1>我的概览</h1>
        <p>个人自动化控制台 · 数据范围：当前绑定的小程序账号 · {{ updatedAt }} 更新</p>
      </div>
      <a-button :loading="loading" @click="load">
        <template #icon><icon-refresh /></template>
        <template #default>刷新</template>
      </a-button>
    </div>

    <a-alert type="info" style="margin-bottom: 14px">
      概览指标由签到、预约、订单与自动预约任务聚合得出，不是全店统计；套餐购买与支付仍在小程序完成。
    </a-alert>

    <a-spin :loading="loading" style="display: block">
      <a-row :gutter="14" class="kpi-row">
        <a-col :xs="12" :xl="6">
          <a-card :bordered="false" class="kpi-card">
            <div class="kpi-label">当前在座</div>
            <div class="kpi-value">{{ currentSigns.length }}<small> 个座位</small></div>
            <div class="kpi-foot">
              <a-tag v-if="currentSigns.length" color="green" size="small">学习中</a-tag>
              <a-tag v-else size="small">未签到</a-tag>
              <span>{{ currentSigns.length ? `${seatText} · ${venueText}` : '暂无在座记录' }}</span>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="12" :xl="6">
          <a-card :bordered="false" class="kpi-card">
            <div class="kpi-label">累计签到</div>
            <div class="kpi-value">{{ indexData?.userSignInfoNum ?? 0 }}<small> 次</small></div>
            <div class="kpi-foot">学习 {{ indexData?.studyDays ?? 0 }} 天</div>
          </a-card>
        </a-col>
        <a-col :xs="12" :xl="6">
          <a-card :bordered="false" class="kpi-card">
            <div class="kpi-label">可用套餐</div>
            <div class="kpi-value kpi-value-sm">{{ signInPackage?.packageName || '暂无' }}</div>
            <div class="kpi-foot">
              <span v-if="signInPackage">{{ signInPackage.restTimeStr || signInPackage.restNum || '可用' }}</span>
              <span v-else>未匹配到签到套餐</span>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="12" :xl="6">
          <a-card :bordered="false" class="kpi-card">
            <div class="kpi-label">自动预约</div>
            <div class="kpi-value">{{ enabledTaskCount }}<small> 个启用</small></div>
            <div class="kpi-foot">{{ pausedTaskCount }} 个暂停 · 放号 {{ releaseTime }}</div>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="14">
        <a-col :xs="24" :xl="15">
          <a-card :bordered="false" class="gi_card_title" title="近 7 天学习时长">
            <template #extra>
              <span class="card-tip">按签到记录聚合，单位：小时</span>
            </template>
            <div v-if="hasWeekData" class="week-chart">
              <div v-for="bar in weekBars" :key="bar.date" class="week-col">
                <div class="week-value">{{ bar.value ? formatDuration(bar.value) : '' }}</div>
                <div class="week-track">
                  <div class="week-fill" :style="{ height: `${bar.height}%` }" />
                </div>
                <div class="week-label">{{ bar.label }}</div>
              </div>
            </div>
            <a-empty v-else description="近 7 天暂无学习记录" />
          </a-card>

          <a-card :bordered="false" class="gi_card_title" title="最近订单" style="margin-top: 14px">
            <template #extra><span class="card-tip">共 {{ orders.length }} 笔</span></template>
            <a-table
              row-key="id"
              size="small"
              :data="recentOrders"
              :columns="orderColumns"
              :pagination="false"
              :scroll="{ x: 620 }"
            >
              <template #orderNumber="{ record }">
                <span class="mono">{{ record.orderNumber || '—' }}</span>
              </template>
              <template #payRealMoney="{ record }">
                <span class="mono">¥{{ formatMoney(record.payRealMoney) }}</span>
              </template>
              <template #payStateStr="{ record }">
                <a-tag :color="payStateColor(record.payStateStr)" size="small">
                  {{ record.payStateStr || '未知' }}
                </a-tag>
              </template>
              <template #empty>
                <a-empty description="暂无订单" />
              </template>
            </a-table>
          </a-card>
        </a-col>

        <a-col :xs="24" :xl="9">
          <a-card :bordered="false" class="gi_card_title" title="当前在座">
            <template v-if="currentSign">
              <div class="seat-number">{{ seatText }}</div>
              <div class="card-tip">{{ venueText }} · {{ areaText }}</div>
              <a-descriptions :column="1" size="small" style="margin-top: 10px">
                <a-descriptions-item label="签到时间">{{ currentSign.signInTimeStr || '—' }}</a-descriptions-item>
                <a-descriptions-item label="预计签退">{{ currentSign.signOutExpectTimeStr || '—' }}</a-descriptions-item>
                <a-descriptions-item label="今日学习">{{ currentStudyDuration }}</a-descriptions-item>
                <a-descriptions-item label="扣费套餐">{{ currentSign.packageName || '—' }}</a-descriptions-item>
              </a-descriptions>
              <div v-if="currentSigns.length > 1" class="card-tip" style="margin-top: 8px">
                另有 {{ currentSigns.length - 1 }} 个座位在座
              </div>
            </template>
            <a-empty v-else description="当前未签到" />
          </a-card>

          <a-card :bordered="false" class="gi_card_title" title="下一笔预约" style="margin-top: 14px">
            <template v-if="nextReserve">
              <div class="reserve-time">{{ nextReserve.reserveTimeStr || '—' }}</div>
              <div class="cell-main">{{ nextReserve.reserveDateStr || '—' }} {{ nextReserve.reserveWeekStr || '' }}</div>
              <div class="card-tip">{{ nextReserve.venueName || '—' }} · {{ nextReserve.areaName || '' }} {{ nextReserve.seatNumber || '' }}</div>
              <a-tag :color="nextReserve.reserveStatusDesc?.includes('待签到') ? 'arcoblue' : 'gray'" size="small" style="margin-top: 8px">
                {{ nextReserve.reserveStatusDesc || '—' }}
              </a-tag>
            </template>
            <a-empty v-else description="暂无待签到预约" />
          </a-card>

          <a-card :bordered="false" class="gi_card_title" title="自动预约" style="margin-top: 14px">
            <div class="task-stats">
              <div>
                <div class="task-value">{{ enabledTaskCount }}</div>
                <div class="card-tip">启用</div>
              </div>
              <div>
                <div class="task-value">{{ pausedTaskCount }}</div>
                <div class="card-tip">暂停</div>
              </div>
              <div>
                <div class="task-value">{{ releaseTime }}</div>
                <div class="card-tip">放号时刻</div>
              </div>
            </div>
            <div v-if="latestRecord" class="latest-record">
              <a-tag :color="recordStatusColor(latestRecord.status)" size="small">
                {{ recordStatusLabel(latestRecord.status) }}
              </a-tag>
              <span class="cell-main">{{ latestRecord.createTime || '—' }}</span>
              <span class="card-tip">{{ latestRecord.failMsg || latestRecord.seatNumber || '—' }}</span>
            </div>
            <span v-else class="card-tip">暂无执行记录</span>
          </a-card>
        </a-col>
      </a-row>

      <a-card :bordered="false" class="gi_card_title" title="最近执行记录" style="margin-top: 14px">
        <template #extra><span class="card-tip">最近 {{ recentRecords.length }} 条</span></template>
        <a-table
          row-key="id"
          size="small"
          :data="recentRecords"
          :columns="recordColumns"
          :pagination="false"
          :scroll="{ x: 760 }"
        >
          <template #taskId="{ record }">
            <span class="mono">#{{ record.taskId }}</span>
          </template>
          <template #status="{ record }">
            <a-tag :color="recordStatusColor(record.status)" size="small">
              {{ recordStatusLabel(record.status) }}
            </a-tag>
          </template>
          <template #seatNumber="{ record }">
            <span v-if="record.seatNumber" class="mono">{{ record.seatNumber }}</span>
            <span v-else class="card-tip">—</span>
          </template>
          <template #failMsg="{ record }">
            <span :class="{ 'card-tip': !record.failMsg }">{{ record.failMsg || '—' }}</span>
          </template>
          <template #empty>
            <a-empty description="暂无执行记录" />
          </template>
        </a-table>
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import {
  getStudyRoomIndex,
  getStudyRoomUserSetting,
  listStudyRoomOrder,
  listStudyRoomTask,
  listStudyRoomTaskRecord,
  listStudyRoomUserReserve,
  listStudyRoomUserSign,
} from '@/apis/study'
import type {
  StudyRoomAutoReserveTaskRecordResp,
  StudyRoomAutoReserveTaskResp,
  StudyRoomIndexResp,
  StudyRoomUserOrderResp,
  StudyRoomUserReserveResp,
  StudyRoomUserSettingResp,
  StudyRoomUserSignResp,
} from '@/apis/study/type'
import { useUserStore } from '@/stores'

defineOptions({ name: 'StudyRoomDashboard' })

const userStore = useUserStore()

const loading = ref(false)
const updatedAt = ref(dayjs().format('YYYY-MM-DD HH:mm'))
const indexData = ref<StudyRoomIndexResp>()
const history = ref<StudyRoomUserSignResp[]>([])
const reserves = ref<StudyRoomUserReserveResp[]>([])
const orders = ref<StudyRoomUserOrderResp[]>([])
const tasks = ref<StudyRoomAutoReserveTaskResp[]>([])
const records = ref<StudyRoomAutoReserveTaskRecordResp[]>([])
const setting = ref<StudyRoomUserSettingResp>()

const currentSigns = computed(() => {
  const list = indexData.value?.userSignInfoList ?? []
  if (list.length) return list
  return indexData.value?.userSign ? [indexData.value.userSign] : []
})

const currentSign = computed(() => currentSigns.value[0])

const seatText = computed(() => currentSign.value?.seatInfo?.seatNumber
  || currentSign.value?.venueAreaSeat?.seatNumber
  || '—')

const areaText = computed(() => currentSign.value?.seatInfo?.areaName
  || currentSign.value?.venueAreaSeat?.areaName
  || '—')

const venueText = computed(() => currentSign.value?.venue?.venueName
  || indexData.value?.venueNearest?.venueName
  || '—')

const signInPackage = computed(() => indexData.value?.signInUserPackage)

const currentStudyMinutes = computed(() => {
  const info = currentSign.value?.seatInfo
  return (info?.studyHours || 0) * 60 + (info?.studyMinutes || 0)
})

const currentStudyDuration = computed(() => formatDuration(currentStudyMinutes.value))

const enabledTaskCount = computed(() => tasks.value.filter((item) => item.enableStatus === 1).length)
const pausedTaskCount = computed(() => tasks.value.filter((item) => item.enableStatus === 0).length)
const releaseTime = computed(() => setting.value?.config?.releaseTime?.slice(0, 5) || '20:00')

const pendingReserves = computed(() => reserves.value.filter((item) => item.reserveStatusDesc?.includes('待签到')))
const nextReserve = computed(() => {
  return [...pendingReserves.value].sort((a, b) => {
    const left = `${a.reserveDateStr || ''} ${a.reserveTimeStr || ''}`
    const right = `${b.reserveDateStr || ''} ${b.reserveTimeStr || ''}`
    return left.localeCompare(right)
  })[0]
})

const recentOrders = computed(() => orders.value.slice(0, 5))
const recentRecords = computed(() => records.value.slice(0, 5))
const latestRecord = computed(() => records.value[0])

const weekBars = computed(() => {
  const map = new Map<string, number>()
  for (const record of history.value) {
    const date = normalizeDate(record.signDateStr || record.signInTimeStr)
    if (!date) continue
    map.set(date, (map.get(date) || 0) + parseMinutes(record.studyMinuteStr))
  }
  if (currentStudyMinutes.value > 0) {
    const today = dayjs().format('YYYY-MM-DD')
    map.set(today, (map.get(today) || 0) + currentStudyMinutes.value)
  }
  const days = Array.from({ length: 7 }, (_, index) => dayjs().subtract(6 - index, 'day'))
  const max = Math.max(...days.map((day) => map.get(day.format('YYYY-MM-DD')) || 0), 1)
  return days.map((day) => {
    const date = day.format('YYYY-MM-DD')
    const value = map.get(date) || 0
    return {
      date,
      label: day.format('MM-DD'),
      value,
      height: Math.max(2, Math.round((value / max) * 100)),
    }
  })
})

const hasWeekData = computed(() => weekBars.value.some((item) => item.value > 0))

const orderColumns: TableInstance['columns'] = [
  { title: '订单号', dataIndex: 'orderNumber', slotName: 'orderNumber', width: 180 },
  { title: '套餐', dataIndex: 'packageName', minWidth: 140, ellipsis: true, tooltip: true },
  { title: '实付', dataIndex: 'payRealMoney', slotName: 'payRealMoney', width: 100, align: 'right' },
  { title: '状态', dataIndex: 'payStateStr', slotName: 'payStateStr', width: 90, align: 'center' },
  { title: '下单时间', dataIndex: 'buyTimeStr', width: 150 },
]

const recordColumns: TableInstance['columns'] = [
  { title: '执行时间', dataIndex: 'createTime', width: 160 },
  { title: '任务', dataIndex: 'taskId', slotName: 'taskId', width: 90 },
  { title: '目标日期', dataIndex: 'targetDate', width: 110 },
  { title: '结果', dataIndex: 'status', slotName: 'status', width: 90, align: 'center' },
  { title: '实际座位', dataIndex: 'seatNumber', slotName: 'seatNumber', width: 100 },
  { title: '失败原因', dataIndex: 'failMsg', slotName: 'failMsg', minWidth: 160, ellipsis: true, tooltip: true },
]

function parseMinutes(value?: string) {
  if (!value) return 0
  let total = 0
  const hours = value.match(/(\d+)\s*(?:小时|h|H)/)
  const minutes = value.match(/(\d+)\s*(?:分钟|[分m])/i)
  if (hours) total += Number(hours[1]) * 60
  if (minutes) total += Number(minutes[1])
  if (!hours && !minutes) {
    const plain = value.match(/(\d+)/)
    if (plain) total += Number(plain[1])
  }
  return total
}

function formatDuration(minutes: number) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  if (hour && minute) return `${hour}h ${minute}m`
  if (hour) return `${hour}h`
  return `${minute}m`
}

function normalizeDate(value?: string) {
  if (!value) return ''
  const datePart = value.split(' ')[0].replace(/\./g, '-')
  const parsed = dayjs(datePart)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : ''
}

function formatMoney(value?: number) {
  return Number(value || 0).toFixed(2)
}

function payStateColor(status?: string) {
  if (status?.includes('待支付')) return 'orange'
  if (status?.includes('已支付')) return 'green'
  if (status?.includes('已退款')) return 'purple'
  return 'gray'
}

function recordStatusLabel(status: number) {
  return ({ 0: '跳过', 1: '成功', 2: '失败' } as Record<number, string>)[status] ?? '未知'
}

function recordStatusColor(status: number) {
  return ({ 0: 'orange', 1: 'green', 2: 'red' } as Record<number, string>)[status] ?? 'gray'
}

async function load() {
  loading.value = true
  const userId = userStore.userInfo.id
  const settingPromise = userId
    ? getStudyRoomUserSetting(userId).then((res) => res.data).catch(() => undefined)
    : Promise.resolve(undefined)
  try {
    const [indexRes, signRes, reserveRes, orderRes, taskRes, recordRes, settingRes] = await Promise.allSettled([
      getStudyRoomIndex(),
      listStudyRoomUserSign(0),
      listStudyRoomUserReserve(),
      listStudyRoomOrder(),
      listStudyRoomTask({ page: 1, size: 100, sort: ['id,desc'] }),
      listStudyRoomTaskRecord({ page: 1, size: 5, sort: ['id,desc'] }),
      settingPromise,
    ])
    if (indexRes.status === 'fulfilled') indexData.value = indexRes.value.data
    if (signRes.status === 'fulfilled') history.value = signRes.value.data?.list ?? []
    if (reserveRes.status === 'fulfilled') reserves.value = reserveRes.value.data?.list ?? []
    if (orderRes.status === 'fulfilled') orders.value = orderRes.value.data?.list ?? []
    if (taskRes.status === 'fulfilled') tasks.value = taskRes.value.data?.list ?? []
    if (recordRes.status === 'fulfilled') records.value = recordRes.value.data?.list ?? []
    if (settingRes.status === 'fulfilled') setting.value = settingRes.value
    updatedAt.value = dayjs().format('YYYY-MM-DD HH:mm')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.page-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;

  h1 {
    margin: 0 0 2px;
    font-size: 22px;
    line-height: 1.3;
    color: var(--color-text-1);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--color-text-3);
  }

  .arco-btn {
    margin-left: auto;
  }
}

.kpi-row {
  margin-bottom: 14px;
}

.kpi-card {
  height: 100%;
}

.kpi-label {
  color: var(--color-text-3);
  font-size: 12px;
}

.kpi-value {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
  color: var(--color-text-1);
  font-variant-numeric: tabular-nums;

  small {
    font-size: 12px;
    font-weight: 400;
    color: var(--color-text-3);
  }
}

.kpi-value-sm {
  font-size: 18px;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  min-height: 20px;
  color: var(--color-text-3);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-tip {
  color: var(--color-text-3);
  font-size: 12px;
}

.week-chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 190px;
  padding-top: 6px;
}

.week-col {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.week-value {
  height: 16px;
  color: var(--color-text-3);
  font-size: 10px;
  white-space: nowrap;
}

.week-track {
  width: 100%;
  flex: 1;
  display: flex;
  align-items: flex-end;
  background: var(--color-fill-1);
  border-radius: 6px;
  overflow: hidden;
}

.week-fill {
  width: 100%;
  min-height: 2px;
  background: rgb(var(--primary-6));
  border-radius: 6px 6px 0 0;
  transition: height 0.3s ease;
}

.week-label {
  color: var(--color-text-3);
  font-size: 10px;
  white-space: nowrap;
}

.seat-number {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text-1);
  font-variant-numeric: tabular-nums;
}

.reserve-time {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-1);
  font-variant-numeric: tabular-nums;
}

.cell-main {
  font-weight: 600;
  color: var(--color-text-1);
}

.task-stats {
  display: flex;
  gap: 20px;

  .task-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-1);
    font-variant-numeric: tabular-nums;
  }
}

.latest-record {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-2);
}

.mono {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 720px) {
  .week-chart {
    gap: 5px;
    height: 160px;
  }

  .week-value {
    font-size: 9px;
  }

  .kpi-value {
    font-size: 24px;
  }
}
</style>
