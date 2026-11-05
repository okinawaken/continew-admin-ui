<template>
  <div class="gi_page">
    <a-row :gutter="14" class="stat-row">
      <a-col :xs="12" :md="8">
        <a-card :bordered="false"><div class="stat-label">待处理</div><div class="stat-value">{{ pendingCount }}<small> 单</small></div></a-card>
      </a-col>
      <a-col :xs="12" :md="8">
        <a-card :bordered="false"><div class="stat-label">处理中</div><div class="stat-value">{{ processingCount }}<small> 单</small></div></a-card>
      </a-col>
      <a-col :xs="12" :md="8">
        <a-card :bordered="false"><div class="stat-label">已完成</div><div class="stat-value">{{ completedCount }}<small> 单</small></div></a-card>
      </a-col>
    </a-row>

    <a-card :bordered="false" class="gi_card_title" title="报修">
      <template #extra>
        <a-space>
          <a-button :loading="loading" @click="load">
            <template #icon><icon-refresh /></template>
            <template #default>刷新</template>
          </a-button>
          <a-button type="primary" @click="openSubmit">
            <template #icon><icon-plus /></template>
            <template #default>提交报修</template>
          </a-button>
        </a-space>
      </template>

      <div class="toolbar">
        <a-input-search v-model="keyword" placeholder="搜索报修描述 / 门店" allow-clear style="width: 230px" />
        <a-select v-model="stateFilter" placeholder="全部状态" :options="stateOptions" allow-clear style="width: 150px" />
        <span class="toolbar-tip">共 {{ filteredRepairs.length }} 单 · 代理模式只读</span>
      </div>

      <a-spin :loading="loading" style="display: block">
        <a-table
          row-key="id"
          :data="filteredRepairs"
          :columns="columns"
          :pagination="{ pageSize: 10, showTotal: true }"
          :scroll="{ x: 960 }"
        >
          <template #repairDesc="{ record }">
            <div class="cell-main">{{ record.repairDesc || '—' }}</div>
            <div class="cell-sub">#{{ record.id }}</div>
          </template>
          <template #repairImgList="{ record }">
            <a-tag v-if="record.repairImgList?.length" color="cyan" size="small">
              {{ record.repairImgList.length }} 张
            </a-tag>
            <span v-else class="cell-muted">无</span>
          </template>
          <template #handleState="{ record }">
            <a-tag :color="stateColor(record.handleState)" size="small">{{ stateLabel(record.handleState) }}</a-tag>
          </template>
          <template #handleRemark="{ record }">
            <span :class="{ 'cell-muted': !record.handleRemark }">{{ record.handleRemark || '—' }}</span>
          </template>
          <template #action="{ record }">
            <a-link @click="showDetail(record)">查看详情</a-link>
          </template>
          <template #empty>
            <a-empty description="暂无报修记录" />
          </template>
        </a-table>
      </a-spin>
    </a-card>

    <a-drawer v-model:visible="detailVisible" :width="width >= 680 ? 600 : '100%'" :footer="false">
      <template #title>
        <div>
          <div>报修详情</div>
          <div class="drawer-sub">#{{ currentRepair?.id }}</div>
        </div>
      </template>

      <a-spin :loading="detailLoading" style="display: block">
        <template v-if="currentRepair">
          <div class="detail-status">
            <a-tag :color="stateColor(currentRepair.handleState)" size="medium">{{ stateLabel(currentRepair.handleState) }}</a-tag>
            <span class="toolbar-tip">{{ currentRepair.createTimeStr || '—' }}</span>
          </div>

          <a-descriptions :column="1" size="medium">
            <a-descriptions-item label="门店">{{ currentRepair.venueName || '—' }}</a-descriptions-item>
            <a-descriptions-item label="报修内容">{{ currentRepair.repairDesc || '—' }}</a-descriptions-item>
            <a-descriptions-item label="处理备注">{{ currentRepair.handleRemark || '—' }}</a-descriptions-item>
            <a-descriptions-item label="处理时间">{{ currentRepair.handleTimeStr || '—' }}</a-descriptions-item>
          </a-descriptions>

          <a-divider>现场图片</a-divider>
          <div v-if="currentRepair.repairImgList?.length" class="image-list">
            <img
              v-for="url in currentRepair.repairImgList"
              :key="url"
              :src="url"
              alt="报修现场"
            >
          </div>
          <span v-else class="cell-muted">无现场图片</span>

          <a-divider>处理进度</a-divider>
          <a-timeline>
            <a-timeline-item dot-color="green">
              <div class="cell-main">提交报修</div>
              <div class="cell-sub">{{ currentRepair.createTimeStr || '—' }}</div>
            </a-timeline-item>
            <a-timeline-item v-if="currentRepair.handleTimeStr" dot-color="green">
              <div class="cell-main">{{ stateLabel(currentRepair.handleState) }}</div>
              <div class="cell-sub">{{ currentRepair.handleTimeStr }}</div>
            </a-timeline-item>
            <a-timeline-item v-else dot-color="orange">
              <div class="cell-main">等待门店处理</div>
              <div class="cell-sub">处理进度以小程序侧为准</div>
            </a-timeline-item>
          </a-timeline>
        </template>
      </a-spin>
    </a-drawer>

    <a-drawer v-model:visible="submitVisible" :width="width >= 620 ? 560 : '100%'" :footer="false">
      <template #title>
        <div>
          <div>提交报修</div>
          <div class="drawer-sub">提交后由门店处理，进度可在报修列表查看</div>
        </div>
      </template>

      <a-form ref="submitFormRef" :model="submitForm" :rules="submitRules" layout="vertical" size="large">
        <a-form-item label="门店" field="venueId">
          <a-select v-model="submitForm.venueId" placeholder="请选择门店" :options="venueOptions" allow-search />
        </a-form-item>
        <a-form-item label="报修描述" field="repairDesc">
          <a-textarea
            v-model="submitForm.repairDesc"
            placeholder="请描述故障位置、现象与影响范围"
            :max-length="500"
            show-word-limit
            :auto-size="{ minRows: 4, maxRows: 8 }"
          />
        </a-form-item>
        <a-alert type="info" style="margin-bottom: 12px">
          图片上传接口暂不支持，提交时不会附带图片；如需补充图片，请在小程序内操作。
        </a-alert>
        <div class="form-actions">
          <a-button @click="submitVisible = false">取消</a-button>
          <a-button type="primary" :loading="submitting" @click="submitRepair">提交报修</a-button>
        </div>
      </a-form>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import {
  getStudyRoomRepair,
  listStudyRoomRepair,
  listStudyRoomVenue,
  submitStudyRoomRepair,
} from '@/apis/study'
import type { StudyRoomRepairResp } from '@/apis/study/type'

defineOptions({ name: 'StudyRoomRepair' })

const { width } = useWindowSize()

const loading = ref(false)
const detailLoading = ref(false)
const submitting = ref(false)
const keyword = ref('')
const stateFilter = ref<number>()
const repairs = ref<StudyRoomRepairResp[]>([])
const detailVisible = ref(false)
const currentRepair = ref<StudyRoomRepairResp>()
const submitVisible = ref(false)
const submitFormRef = ref<FormInstance>()
const venueList = ref<Array<{ id: number, venueName: string }>>([])

const submitForm = reactive({
  venueId: undefined as number | undefined,
  repairDesc: '',
})

const submitRules = {
  venueId: [{ required: true, message: '请选择门店' }],
  repairDesc: [{ required: true, message: '请输入报修描述' }],
}

const stateOptions = [
  { label: '待处理', value: 0 },
  { label: '处理中', value: 1 },
  { label: '已完成', value: 2 },
]

const venueOptions = computed(() => venueList.value.map((item) => ({
  label: item.venueName,
  value: item.id,
})))

const pendingCount = computed(() => repairs.value.filter((item) => item.handleState === 0).length)
const processingCount = computed(() => repairs.value.filter((item) => item.handleState === 1).length)
const completedCount = computed(() => repairs.value.filter((item) => item.handleState === 2).length)

const filteredRepairs = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return repairs.value.filter((item) => {
    const matchKeyword = !key
      || item.repairDesc?.toLowerCase().includes(key)
      || item.venueName?.toLowerCase().includes(key)
    const matchState = stateFilter.value === undefined || item.handleState === stateFilter.value
    return matchKeyword && matchState
  })
})

const columns: TableInstance['columns'] = [
  { title: '报修内容', dataIndex: 'repairDesc', slotName: 'repairDesc', minWidth: 260 },
  { title: '门店', dataIndex: 'venueName', minWidth: 150, ellipsis: true, tooltip: true },
  { title: '图片', dataIndex: 'repairImgList', slotName: 'repairImgList', width: 90, align: 'center' },
  { title: '提交时间', dataIndex: 'createTimeStr', width: 170 },
  { title: '状态', dataIndex: 'handleState', slotName: 'handleState', width: 100, align: 'center' },
  { title: '处理备注', dataIndex: 'handleRemark', slotName: 'handleRemark', minWidth: 180, ellipsis: true, tooltip: true },
  { title: '操作', dataIndex: 'action', slotName: 'action', width: 100, align: 'center' },
]

function stateLabel(state?: number) {
  return ({ 0: '待处理', 1: '处理中', 2: '已完成' } as Record<number, string>)[state ?? -1] ?? `状态 ${state ?? '—'}`
}

function stateColor(state?: number) {
  return ({ 0: 'orange', 1: 'arcoblue', 2: 'green' } as Record<number, string>)[state ?? -1] ?? 'gray'
}

async function load() {
  loading.value = true
  try {
    const { data } = await listStudyRoomRepair()
    repairs.value = data?.list ?? []
  } finally {
    loading.value = false
  }
}

async function loadVenues() {
  const { data } = await listStudyRoomVenue()
  venueList.value = data?.venueList ?? []
}

async function showDetail(repair: StudyRoomRepairResp) {
  currentRepair.value = repair
  detailVisible.value = true
  detailLoading.value = true
  try {
    const { data } = await getStudyRoomRepair(repair.id)
    currentRepair.value = data
  } finally {
    detailLoading.value = false
  }
}

async function openSubmit() {
  if (!venueList.value.length) await loadVenues()
  submitForm.venueId = venueList.value[0]?.id
  submitForm.repairDesc = ''
  submitFormRef.value?.clearValidate()
  submitVisible.value = true
}

async function submitRepair() {
  const invalid = await submitFormRef.value?.validate()
  if (invalid) return
  submitting.value = true
  try {
    await submitStudyRoomRepair({
      venueId: submitForm.venueId as number,
      repairDesc: submitForm.repairDesc,
      repairImgList: [],
    })
    Message.success('报修已提交')
    submitVisible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([load(), loadVenues()])
})
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

  small {
    font-size: 12px;
    font-weight: 400;
    color: var(--color-text-3);
  }
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.toolbar-tip,
.cell-sub,
.cell-muted {
  color: var(--color-text-3);
  font-size: 12px;
}

.cell-main {
  font-weight: 600;
  color: var(--color-text-1);
}

.drawer-sub {
  margin-top: 2px;
  color: var(--color-text-3);
  font-size: 12px;
  font-weight: 400;
}

.detail-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.image-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  img {
    width: 140px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
