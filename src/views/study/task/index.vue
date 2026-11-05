<template>
  <GiPageLayout>
    <GiTable
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1180 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-select
          v-model="queryForm.venueId"
          placeholder="全部门店"
          :options="venueOptions"
          allow-clear
          allow-search
          style="width: 190px"
          @change="search"
        />
        <a-select
          v-model="queryForm.enableStatus"
          placeholder="全部状态"
          :options="statusOptions"
          allow-clear
          style="width: 140px"
          @change="search"
        />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新建任务</template>
        </a-button>
      </template>

      <template #target="{ record }">
        <div v-if="record.seatId && record.seatId > 0">
          <div class="cell-main">{{ record.seatNumber || `座位 ${record.seatId}` }}</div>
          <div class="cell-sub">{{ record.areaName || '指定座位' }}</div>
        </div>
        <div v-else-if="record.areaId && record.areaId > 0">
          <div class="cell-main">{{ record.areaName || `区域 ${record.areaId}` }}</div>
          <div class="cell-sub">偏好区域 · 自动选座</div>
        </div>
        <span v-else class="cell-muted">任意座位</span>
      </template>

      <template #timeRange="{ record }">
        <span class="mono">{{ formatTime(record.reserveStartTime) }}-{{ formatTime(record.reserveEndTime) }}</span>
      </template>

      <template #weekDays="{ record }">
        <a-space :size="4" wrap>
          <a-tag v-for="day in record.weekDays || []" :key="day" size="small" color="arcoblue">
            {{ weekDayLabel(day) }}
          </a-tag>
          <span v-if="!record.weekDays?.length" class="cell-muted">—</span>
        </a-space>
      </template>

      <template #enableStatus="{ record }">
        <a-tag :color="record.enableStatus === 1 ? 'green' : 'orange'" size="small">
          {{ record.enableStatus === 1 ? '启用' : '暂停' }}
        </a-tag>
      </template>

      <template #action="{ record }">
        <a-space :size="10">
          <a-link title="编辑" @click="onUpdate(record)">编辑</a-link>
          <a-popconfirm
            :content="record.enableStatus === 1 ? '暂停后将不再参与放号，确定暂停？' : '恢复后将参与下一次放号，确定恢复？'"
            @ok="onToggle(record)"
          >
            <a-link :status="record.enableStatus === 1 ? 'warning' : 'success'">
              {{ record.enableStatus === 1 ? '暂停' : '恢复' }}
            </a-link>
          </a-popconfirm>
          <a-popconfirm
            content="将立即尝试一次预约，结果写入执行记录，确定执行？"
            :disabled="record.enableStatus !== 1"
            @ok="onExecute(record)"
          >
            <a-link :disabled="record.enableStatus !== 1" title="立即执行">执行</a-link>
          </a-popconfirm>
          <a-link @click="onRecord(record)">记录</a-link>
          <a-link status="danger" @click="onDelete(record)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <AddDrawer ref="AddDrawerRef" @save-success="search" />
    <RecordDrawer ref="RecordDrawerRef" />
  </GiPageLayout>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import AddDrawer from './AddDrawer.vue'
import RecordDrawer from '@/views/study/record/RecordDrawer.vue'
import {
  deleteStudyRoomTask,
  executeStudyRoomTask,
  listStudyRoomTask,
  listStudyRoomVenue,
  pauseStudyRoomTask,
  resumeStudyRoomTask,
} from '@/apis/study'
import type { StudyRoomAutoReserveTaskResp } from '@/apis/study/type'
import { useTable } from '@/hooks'
import { isMobile } from '@/utils'

defineOptions({ name: 'StudyRoomTask' })

interface TaskQueryForm {
  venueId?: number
  enableStatus?: number
  sort: string[]
}

const queryForm = reactive<TaskQueryForm>({
  venueId: undefined,
  enableStatus: undefined,
  sort: ['id,desc'],
})

const venueOptions = reactive<Array<{ label: string, value: number }>>([])
const statusOptions = [
  { label: '启用', value: 1 },
  { label: '暂停', value: 0 },
]

const weekDayMap: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

function weekDayLabel(day: number) {
  return weekDayMap[day] ?? String(day)
}

function formatTime(value?: string) {
  return value?.slice(0, 5) || '--:--'
}

async function loadVenueOptions() {
  const { data } = await listStudyRoomVenue()
  const list = data?.venueList ?? []
  venueOptions.splice(0, venueOptions.length, ...list.map((item) => ({
    label: item.venueName,
    value: item.id,
  })))
}

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete,
} = useTable((page) => listStudyRoomTask({ ...queryForm, ...page }), { immediate: false })

const columns: TableInstance['columns'] = [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (pagination.current - 1) * pagination.pageSize),
    fixed: !isMobile() ? 'left' : undefined,
  },
  { title: '门店', dataIndex: 'venueName', minWidth: 150, ellipsis: true, tooltip: true },
  { title: '座位 / 区域', dataIndex: 'target', slotName: 'target', minWidth: 170 },
  { title: '期望时段', dataIndex: 'timeRange', slotName: 'timeRange', minWidth: 120 },
  { title: '执行星期', dataIndex: 'weekDays', slotName: 'weekDays', minWidth: 220 },
  { title: '状态', dataIndex: 'enableStatus', slotName: 'enableStatus', width: 90, align: 'center' },
  { title: '放号基线', dataIndex: 'lastMaxReserveDate', width: 120 },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 260,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
  },
]

function reset() {
  queryForm.venueId = undefined
  queryForm.enableStatus = undefined
  search()
}

const AddDrawerRef = ref<InstanceType<typeof AddDrawer>>()
function onAdd() {
  AddDrawerRef.value?.onAdd()
}

function onUpdate(record: StudyRoomAutoReserveTaskResp) {
  AddDrawerRef.value?.onUpdate(record)
}

async function onToggle(record: StudyRoomAutoReserveTaskResp) {
  if (record.enableStatus === 1) {
    await pauseStudyRoomTask(record.id)
    Message.success('任务已暂停')
  } else {
    await resumeStudyRoomTask(record.id)
    Message.success('任务已恢复')
  }
  search()
}

async function onExecute(record: StudyRoomAutoReserveTaskResp) {
  await executeStudyRoomTask(record.id)
  Message.success('执行请求已下发')
  search()
}

function onDelete(record: StudyRoomAutoReserveTaskResp) {
  return handleDelete(() => deleteStudyRoomTask(record.id), {
    content: `是否确定删除「${record.venueName || record.venueId} · ${record.seatNumber || record.areaName || '任意座位'}」的自动预约任务？`,
    showModal: true,
  })
}

const RecordDrawerRef = ref<InstanceType<typeof RecordDrawer>>()
function onRecord(record: StudyRoomAutoReserveTaskResp) {
  RecordDrawerRef.value?.onOpen(record)
}

onMounted(async () => {
  await loadVenueOptions()
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
</style>
