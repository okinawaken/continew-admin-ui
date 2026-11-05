<template>
  <a-drawer
    v-model:visible="visible"
    :width="width >= 900 ? 860 : '100%'"
    :footer="false"
    :mask-closable="true"
    @close="onClose"
  >
    <template #title>
      <div>
        <div>执行记录</div>
        <div class="drawer-sub">{{ taskLabel }}</div>
      </div>
    </template>

    <a-table
      row-key="id"
      size="small"
      :data="records"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      :scroll="{ x: 820 }"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
    >
      <template #triggerType="{ record }">
        <a-tag :color="record.triggerType === 0 ? 'arcoblue' : 'purple'" size="small">
          {{ record.triggerType === 0 ? '定时' : '手动' }}
        </a-tag>
      </template>
      <template #status="{ record }">
        <a-tag :color="statusColor(record.status)" size="small">
          {{ statusLabel(record.status) }}
        </a-tag>
      </template>
      <template #seatNumber="{ record }">
        <span v-if="record.seatNumber" class="mono">{{ record.seatNumber }}</span>
        <span v-else class="muted">—</span>
      </template>
      <template #failMsg="{ record }">
        <span v-if="record.failMsg" class="danger">{{ record.failMsg }}</span>
        <span v-else class="muted">—</span>
      </template>
    </a-table>
  </a-drawer>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { listStudyRoomTaskRecord } from '@/apis/study'
import type { StudyRoomAutoReserveTaskRecordResp, StudyRoomAutoReserveTaskResp } from '@/apis/study/type'

defineOptions({ name: 'StudyRoomTaskRecordDrawer' })

const { width } = useWindowSize()

const visible = ref(false)
const taskId = ref<number>()
const taskLabel = ref('')
const records = ref<StudyRoomAutoReserveTaskRecordResp[]>([])
const loading = ref(false)

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true,
})

const columns: TableInstance['columns'] = [
  { title: '执行时间', dataIndex: 'createTime', width: 170 },
  { title: '目标日期', dataIndex: 'targetDate', width: 110 },
  { title: '触发方式', dataIndex: 'triggerType', slotName: 'triggerType', width: 90 },
  { title: '结果', dataIndex: 'status', slotName: 'status', width: 90 },
  { title: '实际座位', dataIndex: 'seatNumber', slotName: 'seatNumber', width: 100 },
  { title: '时段', dataIndex: 'timeRange', width: 120 },
  { title: '失败原因', dataIndex: 'failMsg', slotName: 'failMsg', minWidth: 140, ellipsis: true, tooltip: true },
]

function statusLabel(status: number) {
  return ({ 0: '跳过', 1: '成功', 2: '失败' } as Record<number, string>)[status] ?? '未知'
}

function statusColor(status: number) {
  return ({ 0: 'orange', 1: 'green', 2: 'red' } as Record<number, string>)[status] ?? 'gray'
}

async function load() {
  if (!taskId.value) return
  loading.value = true
  try {
    const { data } = await listStudyRoomTaskRecord({
      taskId: taskId.value,
      page: pagination.current,
      size: pagination.pageSize,
      sort: ['id,desc'],
    })
    records.value = data?.list ?? []
    pagination.total = data?.total ?? 0
  } finally {
    loading.value = false
  }
}

function onPageChange(page: number) {
  pagination.current = page
  load()
}

function onPageSizeChange(size: number) {
  pagination.pageSize = size
  pagination.current = 1
  load()
}

function onOpen(record: StudyRoomAutoReserveTaskResp) {
  taskId.value = record.id
  taskLabel.value = `${record.venueName || record.venueId} · ${record.seatNumber || record.areaName || '任意座位'}`
  pagination.current = 1
  visible.value = true
  load()
}

function onClose() {
  visible.value = false
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss">
.drawer-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-3);
  font-weight: 400;
}

.mono {
  font-variant-numeric: tabular-nums;
}

.muted {
  color: var(--color-text-3);
}

.danger {
  color: rgb(var(--danger-6));
}
</style>
