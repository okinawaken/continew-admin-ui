<template>
  <div class="gi_page">
    <a-alert v-if="!currentSigns.length" type="info" style="margin-bottom: 14px">
      当前未签到。签到与选座需要在门店前台扫码完成，这里展示已签到后的在座信息与历史记录。
    </a-alert>

    <a-card :bordered="false" class="gi_card_title" title="当前在座">
      <template #extra>
        <a-space>
          <a-button :loading="loading" @click="load">
            <template #icon><icon-refresh /></template>
            <template #default>刷新</template>
          </a-button>
          <a-button @click="onSignInTip">签到选座</a-button>
        </a-space>
      </template>

      <a-spin :loading="loading" style="display: block">
        <div v-if="currentSigns.length" class="sign-list">
          <div v-for="sign in currentSigns" :key="sign.id" class="sign-card">
            <div class="sign-main">
              <div class="sign-seat">{{ seatLabel(sign) }}</div>
              <div class="sign-sub">
                {{ sign.venue?.venueName || sign.seatInfo?.areaName || '—' }}
                <span v-if="sign.seatInfo?.areaName"> · {{ sign.seatInfo.areaName }}</span>
              </div>
              <div class="sign-meta">
                <span>签到 {{ sign.signInTimeStr || '—' }}</span>
                <span>预计签退 {{ sign.signOutExpectTimeStr || '—' }}</span>
                <span v-if="sign.packageName">套餐 {{ sign.packageName }}</span>
                <span v-if="sign.restTimeStr">剩余 {{ sign.restTimeStr }}</span>
              </div>
            </div>
            <div class="sign-actions">
              <a-button size="small" type="primary" :disabled="!sign.id" @click="onSettle(sign)">签退结算</a-button>
              <a-button size="small" :disabled="!sign.id" @click="onChangeSeat(sign)">换座</a-button>
              <a-button
                v-if="indexData?.seatCurrent?.id"
                size="small"
                @click="onLight"
              >
                开灯
              </a-button>
            </div>
          </div>
        </div>
        <a-empty v-else description="暂无在座记录" />
      </a-spin>
    </a-card>

    <a-row :gutter="14" class="stat-row">
      <a-col :xs="12" :md="6">
        <a-card :bordered="false"><div class="stat-label">累计签到</div><div class="stat-value">{{ indexData?.userSignInfoNum ?? 0 }}<small> 次</small></div></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card :bordered="false"><div class="stat-label">学习天数</div><div class="stat-value">{{ indexData?.studyDays ?? 0 }}<small> 天</small></div></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card :bordered="false"><div class="stat-label">预约记录</div><div class="stat-value">{{ indexData?.userReserveInfoNum ?? 0 }}<small> 条</small></div></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card :bordered="false"><div class="stat-label">今日打卡</div><div class="stat-value">{{ currentSigns[0]?.signSerialNo || '—' }}<small> 位</small></div></a-card>
      </a-col>
    </a-row>

    <a-card :bordered="false" class="gi_card_title" title="历史签到记录">
      <template #extra>
        <a-space>
          <a-button size="small" :loading="moreLoading" @click="loadMore">加载更多</a-button>
          <a-button size="small" @click="onGuard">门禁开门</a-button>
        </a-space>
      </template>
      <a-table
        row-key="id"
        :data="history"
        :columns="historyColumns"
        :pagination="{ pageSize: 10, showTotal: true }"
        :scroll="{ x: 960 }"
      >
        <template #seat="{ record }">
          <div class="cell-main">{{ record.venueAreaSeat?.seatNumber || record.seatInfo?.seatNumber || '—' }}</div>
          <div class="cell-sub">{{ record.venueAreaSeat?.areaName || record.seatInfo?.areaName || '—' }}</div>
        </template>
        <template #signTime="{ record }">
          <div>{{ record.signInTimeStr || '—' }}</div>
          <div class="cell-sub">{{ record.signOutTimeStr || '进行中' }}</div>
        </template>
        <template #studyMinuteStr="{ record }">
          <span class="mono">{{ record.studyMinuteStr || '—' }}</span>
        </template>
        <template #status="{ record }">
          <a-tag :color="record.signOutTimeStr ? (record.hasPayed === 1 ? 'green' : 'orange') : 'arcoblue'" size="small">
            {{ record.signOutTimeStr ? (record.hasPayed === 1 ? '已扣费' : '未扣费') : '进行中' }}
          </a-tag>
        </template>
        <template #empty>
          <a-empty description="暂无签到记录" />
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="guardVisible" title="门禁开门" @before-ok="confirmGuard" @cancel="guardVisible = false">
      <a-spin :loading="guardLoading" style="display: block">
        <a-radio-group v-model="selectedGuardId" class="guard-list">
          <a-radio v-for="guard in guardList" :key="guard.id" :value="guard.id" :disabled="guard.canOpen !== 1">
            {{ guard.areaAliasName || `门禁 ${guard.id}` }}
            <span v-if="guard.canOpen !== 1" class="cell-sub">（{{ guard.canNotOpenDesc || '暂不可开' }}）</span>
          </a-radio>
        </a-radio-group>
        <a-empty v-if="!guardList.length && !guardLoading" description="暂无门禁区域" />
      </a-spin>
    </a-modal>

    <a-modal v-model:visible="settleVisible" title="签退结算" @before-ok="confirmSettle" @cancel="settleVisible = false">
      <a-spin :loading="settleLoading" style="display: block">
        <template v-if="settlement">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="门店">{{ settlement.venueName || '—' }}</a-descriptions-item>
            <a-descriptions-item label="结算时长">{{ settlement.settleData?.settleTimeStr || '—' }}</a-descriptions-item>
            <a-descriptions-item label="学习时长">{{ settlement.settleData?.studyTimeDesc || '—' }}</a-descriptions-item>
            <a-descriptions-item label="已使用时长">{{ settlement.settleData?.usedTimeStr || '—' }}</a-descriptions-item>
          </a-descriptions>
          <a-divider>选择结算套餐</a-divider>
          <a-radio-group v-model="selectedSettlePackageId" class="settle-list">
            <a-radio
              v-for="pkg in settlement.userPackageList || []"
              :key="pkg.id"
              :value="pkg.id"
              :disabled="pkg.canUsePay !== 1"
            >
              {{ pkg.packageName || `套餐 ${pkg.id}` }}
              <span class="cell-sub">{{ pkg.restTimeStr || pkg.settleHourStr || '' }}</span>
            </a-radio>
          </a-radio-group>
          <a-alert v-if="!settlement.userPackageList?.length" type="warning" style="margin-top: 10px">
            暂无可用于结算的套餐，请先在小程序购买套餐或处理欠费。
          </a-alert>
          <a-alert v-if="settlement.studyTipText" type="info" style="margin-top: 10px">
            {{ settlement.studyTipText }}
          </a-alert>
        </template>
      </a-spin>
    </a-modal>

    <a-modal v-model:visible="changeSeatVisible" title="换座" @before-ok="confirmChangeSeat" @cancel="changeSeatVisible = false">
      <a-spin :loading="changeSeatLoading" style="display: block">
        <a-select
          v-model="selectedChangeSeatId"
          placeholder="请选择目标座位"
          :options="changeSeatOptions"
          allow-search
          style="width: 100%"
        />
        <a-alert type="info" style="margin-top: 10px">
          换座后当前签到会迁移到新座位，请确认目标座位可用。
        </a-alert>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import {
  confirmStudyRoomChangeSeat,
  confirmStudyRoomUserPackage,
  getStudyRoomIndex,
  getStudyRoomSettlement,
  listStudyRoomChangeSeat,
  listStudyRoomGuard,
  listStudyRoomUserSign,
  listStudyRoomUserSignMore,
  openStudyRoomGuard,
  turnStudyRoomLight,
} from '@/apis/study'
import type {
  StudyRoomGuardResp,
  StudyRoomIndexResp,
  StudyRoomSettlementResp,
  StudyRoomUserSignResp,
} from '@/apis/study/type'

defineOptions({ name: 'StudyRoomSign' })

const loading = ref(false)
const moreLoading = ref(false)
const indexData = ref<StudyRoomIndexResp>()
const history = ref<StudyRoomUserSignResp[]>([])

const currentSigns = computed(() => {
  const list = indexData.value?.userSignInfoList ?? []
  if (list.length) return list
  return indexData.value?.userSign ? [indexData.value.userSign] : []
})

function seatLabel(sign: StudyRoomUserSignResp) {
  return sign.seatInfo?.seatNumber || sign.venueAreaSeat?.seatNumber || '—'
}

const historyColumns: TableInstance['columns'] = [
  { title: '日期', dataIndex: 'signDateStr', width: 120 },
  { title: '门店', dataIndex: 'venue', minWidth: 150, render: ({ record }: { record: StudyRoomUserSignResp }) => record.venue?.venueName || '—' },
  { title: '区域 / 座位', dataIndex: 'seat', slotName: 'seat', minWidth: 150 },
  { title: '签到 / 签退', dataIndex: 'signTime', slotName: 'signTime', width: 140 },
  { title: '学习时长', dataIndex: 'studyMinuteStr', slotName: 'studyMinuteStr', width: 120 },
  { title: '扣费套餐', dataIndex: 'packageNamePayed', minWidth: 150, ellipsis: true, tooltip: true },
  { title: '状态', dataIndex: 'status', slotName: 'status', width: 100, align: 'center' },
]

async function load() {
  loading.value = true
  try {
    const [indexRes, signRes] = await Promise.all([
      getStudyRoomIndex(),
      listStudyRoomUserSign(0),
    ])
    indexData.value = indexRes.data
    history.value = signRes.data?.list ?? []
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  moreLoading.value = true
  try {
    const { data } = await listStudyRoomUserSignMore()
    const list = data?.list ?? []
    const existed = new Set(history.value.map((item) => item.id))
    history.value.push(...list.filter((item) => !existed.has(item.id)))
    if (!list.length) Message.info('没有更多签到记录了')
  } finally {
    moreLoading.value = false
  }
}

async function onLight() {
  const seatId = indexData.value?.seatCurrent?.id
  if (!seatId) {
    Message.warning('当前没有可控制的座位')
    return
  }
  await turnStudyRoomLight({ seatId, turnFlag: 'turnOn' })
  Message.success('开灯指令已发送')
}

async function onSignInTip() {
  Message.info('签到选座需在门店前台扫码完成，请在微信小程序操作')
}

const guardVisible = ref(false)
const guardLoading = ref(false)
const guardList = ref<StudyRoomGuardResp[]>([])
const selectedGuardId = ref<number>()

async function onGuard() {
  const venueId = indexData.value?.seatCurrent?.venueId
    || currentSigns.value[0]?.venueId
    || indexData.value?.venueNearest?.id
  if (!venueId) {
    Message.warning('当前没有可用的门店信息')
    return
  }
  guardVisible.value = true
  guardLoading.value = true
  try {
    const { data } = await listStudyRoomGuard(venueId)
    guardList.value = data?.guardList ?? []
    const firstOpen = guardList.value.find((item) => item.canOpen === 1)
    selectedGuardId.value = firstOpen?.id
  } finally {
    guardLoading.value = false
  }
}

async function confirmGuard() {
  if (!selectedGuardId.value) {
    Message.warning('请选择可开启的门禁')
    return false
  }
  await openStudyRoomGuard({ guardId: selectedGuardId.value })
  Message.success('开门指令已发送')
  guardVisible.value = false
  return true
}

const settleVisible = ref(false)
const settleLoading = ref(false)
const settlement = ref<StudyRoomSettlementResp>()
const selectedSettlePackageId = ref<number>()
const settleSignId = ref<number>()

async function onSettle(sign: StudyRoomUserSignResp) {
  if (!sign.id) {
    Message.warning('当前签到信息缺少签到 ID')
    return
  }
  settleSignId.value = sign.id
  settleVisible.value = true
  settleLoading.value = true
  try {
    const { data } = await getStudyRoomSettlement({ userSignId: sign.id })
    settlement.value = data
    const preferred = data?.userPackageList?.find((item) => item.autoSelected === 1 && item.canUsePay === 1)
      || data?.userPackageList?.find((item) => item.canUsePay === 1)
    selectedSettlePackageId.value = preferred?.id
  } finally {
    settleLoading.value = false
  }
}

async function confirmSettle() {
  if (!settleSignId.value || !selectedSettlePackageId.value) {
    Message.warning('请选择可用于结算的套餐')
    return false
  }
  const { data } = await confirmStudyRoomUserPackage({
    userSignId: settleSignId.value,
    userPackageId: selectedSettlePackageId.value,
  })
  Message.success(data?.studyTipText || '结算已提交')
  settleVisible.value = false
  await load()
  return true
}

const changeSeatVisible = ref(false)
const changeSeatLoading = ref(false)
const changeSeatOptions = ref<Array<{ label: string, value: number, disabled?: boolean }>>([])
const selectedChangeSeatId = ref<number>()
const changeSeatSignId = ref<number>()

async function onChangeSeat(sign: StudyRoomUserSignResp) {
  if (!sign.id) {
    Message.warning('当前签到信息缺少签到 ID')
    return
  }
  changeSeatSignId.value = sign.id
  changeSeatVisible.value = true
  changeSeatLoading.value = true
  try {
    const { data } = await listStudyRoomChangeSeat({ userSignId: sign.id })
    const options: Array<{ label: string, value: number, disabled?: boolean }> = []
    for (const area of data?.venueAreaList ?? []) {
      for (const seat of area.venueAreaSeatList ?? []) {
        options.push({
          label: `${area.areaName} · ${seat.seatNumber}`,
          value: seat.id,
          disabled: seat.seatReserveState === 30,
        })
      }
    }
    changeSeatOptions.value = options
    selectedChangeSeatId.value = options.find((item) => !item.disabled)?.value
  } finally {
    changeSeatLoading.value = false
  }
}

async function confirmChangeSeat() {
  if (!changeSeatSignId.value || !selectedChangeSeatId.value) {
    Message.warning('请选择目标座位')
    return false
  }
  const { data } = await confirmStudyRoomChangeSeat({
    seatId: selectedChangeSeatId.value,
    userSignId: changeSeatSignId.value,
  })
  Message.success(data?.studyTipText || '换座成功')
  changeSeatVisible.value = false
  await load()
  return true
}

onMounted(load)
</script>

<style scoped lang="scss">
.sign-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sign-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 10px;
  background: linear-gradient(180deg, rgb(var(--primary-1)), var(--color-bg-2) 70%);
}

.sign-main {
  min-width: 0;
  flex: 1;
}

.sign-seat {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-1);
  font-variant-numeric: tabular-nums;
}

.sign-sub {
  margin-top: 2px;
  color: var(--color-text-2);
  font-size: 13px;
}

.sign-meta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 8px;
  color: var(--color-text-3);
  font-size: 12px;
}

.sign-actions {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.stat-row {
  margin: 14px 0;
}

.stat-label {
  color: var(--color-text-3);
  font-size: 12px;
}

.stat-value {
  margin-top: 4px;
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-1);
  font-variant-numeric: tabular-nums;

  small {
    font-size: 12px;
    font-weight: 400;
    color: var(--color-text-3);
  }
}

.cell-main {
  font-weight: 600;
  color: var(--color-text-1);
}

.cell-sub,
.cell-muted {
  margin-top: 2px;
  color: var(--color-text-3);
  font-size: 12px;
}

.mono {
  font-variant-numeric: tabular-nums;
}

.guard-list,
.settle-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
