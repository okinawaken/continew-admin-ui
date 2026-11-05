<template>
  <GiPageLayout>
    <GiTable
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1120 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-select
          v-model="queryForm.taskId"
          placeholder="全部任务"
          :options="taskOptions"
          allow-clear
          allow-search
          style="width: 230px"
          @change="search"
        />
        <a-select
          v-model="queryForm.status"
          placeholder="全部结果"
          :options="statusOptions"
          allow-clear
          style="width: 130px"
          @change="search"
        />
        <a-select
          v-model="queryForm.triggerType"
          placeholder="全部触发方式"
          :options="triggerOptions"
          allow-clear
          style="width: 150px"
          @change="search"
        />
        <a-date-picker
          v-model="queryForm.targetDate"
          value-format="YYYY-MM-DD"
          placeholder="目标日期"
          style="width: 150px"
          @change="search"
        />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>

      <template #taskId="{ record }">
        <div class="cell-main">{{ taskLabel(record.taskId) }}</div>
        <div class="cell-sub mono">#{{ record.taskId }}</div>
      </template>

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
        <span v-else class="cell-muted">—</span>
      </template>

      <template #failMsg="{ record }">
        <span v-if="record.failMsg" class="danger">{{ record.failMsg }}</span>
        <span v-else class="cell-muted">—</span>
      </template>
    </GiTable>
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { useRoute } from 'vue-router'
import { listStudyRoomTask, listStudyRoomTaskRecord } from '@/apis/study'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'

defineOptions({ name: 'StudyRoomRecord' })

interface RecordQueryForm {
  taskId?: number
  status?: number
  triggerType?: number
  targetDate?: string
  sort: string[]
}

const route = useRoute()
const routeTaskId = Number(route.query.taskId)
const queryForm = reactive<RecordQueryForm>({
  taskId: Number.isFinite(routeTaskId) && routeTaskId > 0 ? routeTaskId : undefined,
  status: undefined,
  triggerType: undefined,
  targetDate: undefined,
  sort: ['id,desc'],
})

const statusOptions = [
  { label: '成功', value: 1 },
  { label: '跳过', value: 0 },
  { label: '失败', value: 2 },
]

const triggerOptions = [
  { label: '定时执行', value: 0 },
  { label: '手动执行', value: 1 },
]

const taskOptions = reactive<Array<{ label: string, value: number }>>([])
const taskLabels = reactive<Record<number, string>>({})

function taskLabel(taskId: number) {
  return taskLabels[taskId] || `任务 #${taskId}`
}

function statusLabel(status: number) {
  return ({ 0: '跳过', 1: '成功', 2: '失败' } as Record<number, string>)[status] ?? '未知'
}

function statusColor(status: number) {
  return ({ 0: 'orange', 1: 'green', 2: 'red' } as Record<number, string>)[status] ?? 'gray'
}

async function loadTaskOptions() {
  const { data } = await listStudyRoomTask({ page: 1, size: 200, sort: ['id,desc'] })
  const list = data?.list ?? []
  taskOptions.splice(0, taskOptions.length, ...list.map((item) => ({
    label: `${item.venueName || item.venueId} · ${item.seatNumber || item.areaName || '任意座位'}`,
    value: item.id,
  })))
  for (const item of list) {
    taskLabels[item.id] = `${item.venueName || item.venueId} · ${item.seatNumber || item.areaName || '任意座位'}`
  }
}

const {
  tableData: dataList,
  loading,
  pagination,
  search,
} = useTable((page) => listStudyRoomTaskRecord({ ...queryForm, ...page }), { immediate: false })

const columns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (pagination.current - 1) * pagination.pageSize),
    fixed: !isMobile() ? 'left' : undefined,
  },
  { title: '执行时间', dataIndex: 'createTime', width: 170 },
  { title: '任务', dataIndex: 'taskId', slotName: 'taskId', minWidth: 210 },
  { title: '目标日期', dataIndex: 'targetDate', width: 110 },
  { title: '触发方式', dataIndex: 'triggerType', slotName: 'triggerType', width: 100, align: 'center' },
  { title: '结果', dataIndex: 'status', slotName: 'status', width: 90, align: 'center' },
  { title: '实际座位', dataIndex: 'seatNumber', slotName: 'seatNumber', width: 100 },
  { title: '时段', dataIndex: 'timeRange', width: 120 },
  { title: '上游预约单', dataIndex: 'userReserveId', width: 130 },
  { title: '失败原因', dataIndex: 'failMsg', slotName: 'failMsg', minWidth: 150, ellipsis: true, tooltip: true },
]

function reset() {
  queryForm.taskId = undefined
  queryForm.status = undefined
  queryForm.triggerType = undefined
  queryForm.targetDate = undefined
  search()
}

onMounted(async () => {
  await loadTaskOptions()
  search()
})
</script>

<style scoped lang="scss">
.cell-main {
  font-weight: 600;
  color: var(--color-text-1);
}

.cell-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-3);
}

.cell-muted {
  color: var(--color-text-3);
}

.mono {
  font-variant-numeric: tabular-nums;
}

.danger {
  color: rgb(var(--danger-6));
}
</style>
