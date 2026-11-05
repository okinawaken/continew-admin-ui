<template>
  <div class="gi_page">
    <a-row :gutter="14" class="stat-row">
      <a-col :xs="12" :md="6">
        <a-card :bordered="false"><div class="stat-label">全部预约</div><div class="stat-value">{{ records.length }}</div></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card :bordered="false"><div class="stat-label">待签到</div><div class="stat-value">{{ pendingCount }}</div></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card :bordered="false"><div class="stat-label">已完成</div><div class="stat-value">{{ completedCount }}</div></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card :bordered="false"><div class="stat-label">已取消</div><div class="stat-value">{{ cancelledCount }}</div></a-card>
      </a-col>
    </a-row>

    <a-card :bordered="false" class="gi_card_title" title="我的预约">
      <template #extra>
        <a-button :loading="loading" @click="load">
          <template #icon><icon-refresh /></template>
          <template #default>刷新</template>
        </a-button>
      </template>

      <div class="toolbar">
        <a-input-search v-model="keyword" placeholder="搜索门店 / 座位号" allow-clear style="width: 220px" />
        <a-select v-model="statusFilter" placeholder="全部状态" :options="statusOptions" allow-clear style="width: 150px" />
        <span class="toolbar-tip">共 {{ filteredRecords.length }} 条 · 接口一次性返回全部记录</span>
      </div>

      <a-spin :loading="loading" style="display: block">
        <a-table
          row-key="id"
          :data="filteredRecords"
          :columns="columns"
          :pagination="{ pageSize: 10, showTotal: true, showPageSize: true }"
          :scroll="{ x: 960 }"
        >
          <template #reserveDateStr="{ record }">
            <div class="cell-main">{{ record.reserveDateStr || '—' }}</div>
            <div class="cell-sub">{{ record.reserveWeekStr || '—' }}</div>
          </template>
          <template #reserveTimeStr="{ record }">
            <span class="mono">{{ record.reserveTimeStr || '—' }}</span>
          </template>
          <template #seat="{ record }">
            <div class="cell-main">{{ record.seatNumber || '—' }}</div>
            <div class="cell-sub">{{ record.areaName || '—' }}</div>
          </template>
          <template #reserveStatusDesc="{ record }">
            <a-tag :color="statusColor(record.reserveStatusDesc)" size="small">
              {{ record.reserveStatusDesc || '未知' }}
            </a-tag>
          </template>
          <template #subscribeFlag="{ record }">
            <a-tag :color="record.subscribeFlag === 1 ? 'arcoblue' : 'gray'" size="small">
              {{ record.subscribeFlag === 1 ? '已订阅' : '未订阅' }}
            </a-tag>
          </template>
          <template #action="{ record }">
            <a-space>
              <a-link
                v-if="record.canCancel === 1"
                status="danger"
                @click="onCancel(record)"
              >
                取消预约
              </a-link>
              <span v-else class="cell-muted">不可取消</span>
            </a-space>
          </template>
          <template #empty>
            <a-empty description="暂无预约记录" />
          </template>
        </a-table>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message, Modal } from '@arco-design/web-vue'
import { cancelStudyRoomReserve, getStudyRoomReserveCancelTip, listStudyRoomUserReserve } from '@/apis/study'
import type { StudyRoomUserReserveResp } from '@/apis/study/type'

defineOptions({ name: 'StudyRoomReserve' })

const loading = ref(false)
const keyword = ref('')
const statusFilter = ref<string>()
const records = ref<StudyRoomUserReserveResp[]>([])

const statusOptions = [
  { label: '待签到', value: '待签到' },
  { label: '已完成', value: '已完成' },
  { label: '已取消', value: '已取消' },
]

const pendingCount = computed(() => records.value.filter((item) => item.reserveStatusDesc?.includes('待签到')).length)
const completedCount = computed(() => records.value.filter((item) => item.reserveStatusDesc?.includes('已完成')).length)
const cancelledCount = computed(() => records.value.filter((item) => item.reserveStatusDesc?.includes('已取消')).length)

const filteredRecords = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return records.value.filter((item) => {
    const matchKeyword = !key
      || item.venueName?.toLowerCase().includes(key)
      || item.seatNumber?.toLowerCase().includes(key)
      || item.areaName?.toLowerCase().includes(key)
    const matchStatus = !statusFilter.value || item.reserveStatusDesc?.includes(statusFilter.value)
    return matchKeyword && matchStatus
  })
})

const columns: TableInstance['columns'] = [
  { title: '日期', dataIndex: 'reserveDateStr', slotName: 'reserveDateStr', width: 130 },
  { title: '时段', dataIndex: 'reserveTimeStr', slotName: 'reserveTimeStr', width: 130 },
  { title: '门店', dataIndex: 'venueName', minWidth: 150, ellipsis: true, tooltip: true },
  { title: '区域 / 座位', dataIndex: 'seatNumber', slotName: 'seat', minWidth: 150 },
  { title: '状态', dataIndex: 'reserveStatusDesc', slotName: 'reserveStatusDesc', width: 110, align: 'center' },
  { title: '订阅提醒', dataIndex: 'subscribeFlag', slotName: 'subscribeFlag', width: 100, align: 'center' },
  { title: '操作', dataIndex: 'action', slotName: 'action', width: 120, align: 'center' },
]

function statusColor(status?: string) {
  if (status?.includes('待签到')) return 'arcoblue'
  if (status?.includes('已完成')) return 'green'
  if (status?.includes('已取消')) return 'gray'
  return 'orange'
}

async function load() {
  loading.value = true
  try {
    const { data } = await listStudyRoomUserReserve()
    records.value = data?.list ?? []
  } finally {
    loading.value = false
  }
}

async function onCancel(record: StudyRoomUserReserveResp) {
  const { data } = await getStudyRoomReserveCancelTip(record.id)
  Modal.warning({
    title: '确认取消预约',
    content: data?.tipDesc || '取消后座位会立即释放，可能被其他人预约。确定取消？',
    okButtonProps: { status: 'danger' },
    hideCancel: false,
    maskClosable: false,
    onBeforeOk: async () => {
      await cancelStudyRoomReserve({ userReserveId: record.id })
      Message.success('预约已取消')
      await load()
      return true
    },
  })
}

onMounted(load)
</script>

<style scoped lang="scss">
.stat-row {
  margin-bottom: 14px;
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
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.toolbar-tip {
  color: var(--color-text-3);
  font-size: 12px;
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
</style>
