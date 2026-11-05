<template>
  <div class="gi_page">
    <a-card :bordered="false" class="gi_card_title" title="储物柜">
      <template #extra>
        <a-button :loading="loading" @click="loadAll">
          <template #icon><icon-refresh /></template>
          <template #default>刷新</template>
        </a-button>
      </template>

      <div class="toolbar">
        <a-select
          v-model="venueId"
          placeholder="请选择门店"
          :options="venueOptions"
          allow-search
          style="width: 190px"
          @change="onVenueChange"
        />
        <a-select
          v-model="cabinetId"
          placeholder="请选择柜体"
          :options="cabinetOptions"
          allow-search
          style="width: 180px"
          @change="loadGrids"
        />
        <span class="toolbar-tip">在售 {{ currentCabinet?.saleCount ?? 0 }} 个格口 · 租赁与支付需在小程序完成</span>
      </div>

      <a-spin :loading="loading" style="display: block">
        <a-row :gutter="14">
          <a-col :xs="24" :xl="16">
            <a-card :bordered="true" title="柜体格口" size="small">
              <div class="legend">
                <span><i class="swatch free" />空闲</span>
                <span><i class="swatch leased" />已租</span>
                <span><i class="swatch broken" />异常</span>
                <span class="toolbar-tip">点击格口查看计费</span>
              </div>
              <div v-if="grids.length" class="cabinet-grid">
                <button
                  v-for="grid in grids"
                  :key="grid.gridId"
                  type="button"
                  class="cabinet-cell"
                  :class="gridClass(grid)"
                  :title="`${grid.gridCode || grid.gridId} · ${gridStatusLabel(grid)}`"
                  @click="showPrice(grid)"
                >
                  {{ grid.gridCode || grid.gridId }}
                </button>
              </div>
              <a-empty v-else description="当前柜体暂无可展示格口" />
            </a-card>
          </a-col>

          <a-col :xs="24" :xl="8">
            <a-card :bordered="true" title="我的柜格" size="small">
              <div v-if="myGrids.length" class="my-grid-list">
                <div v-for="grid in myGrids" :key="grid.gripId" class="my-grid">
                  <div class="my-grid-info">
                    <div class="cell-main">{{ grid.gripCode || grid.gripId }} · {{ grid.cabinetName || '柜格' }}</div>
                    <div class="cell-sub">租期至 {{ grid.leaseEndTime || '—' }}</div>
                  </div>
                  <a-space :size="6">
                    <a-button
                      size="small"
                      type="primary"
                      :disabled="grid.allowOpen !== 1"
                      @click="openLock(grid)"
                    >
                      开锁
                    </a-button>
                    <a-button
                      size="small"
                      status="danger"
                      :disabled="!grid.lastLeaseId"
                      @click="onCheckout(grid)"
                    >
                      退租
                    </a-button>
                  </a-space>
                </div>
              </div>
              <a-empty v-else description="暂无已租柜格" />
            </a-card>
          </a-col>
        </a-row>

        <a-card :bordered="true" title="租赁订单" size="small" style="margin-top: 14px">
          <a-table
            row-key="id"
            :data="leaseOrders"
            :columns="orderColumns"
            :pagination="{ pageSize: 10, showTotal: true }"
            :scroll="{ x: 820 }"
          >
            <template #order="{ record }">
              <div class="cell-main mono">#{{ record.id }}</div>
              <div class="cell-sub mono">lease {{ record.leaseId || '—' }}</div>
            </template>
            <template #leaseRange="{ record }">
              <span class="mono">{{ record.startDateStr || '—' }} 至 {{ record.endDateStr || '—' }}</span>
            </template>
            <template #priceYuan="{ record }">
              <span class="mono">¥{{ Number(record.priceYuan || 0).toFixed(2) }}</span>
            </template>
            <template #payStateStr="{ record }">
              <a-tag :color="record.payState === 1 ? 'green' : 'orange'" size="small">
                {{ record.payStateStr || '—' }}
              </a-tag>
            </template>
            <template #empty>
              <a-empty description="暂无租赁订单" />
            </template>
          </a-table>
        </a-card>
      </a-spin>
    </a-card>

    <a-modal v-model:visible="priceVisible" title="柜格计费" :footer="false" @cancel="priceVisible = false">
      <a-spin :loading="priceLoading" style="display: block">
        <a-descriptions v-if="gridPrice" :column="1" size="medium">
          <a-descriptions-item label="格口编号">{{ gridPrice.gridCode || gridPrice.gridId || '—' }}</a-descriptions-item>
          <a-descriptions-item label="最早可租">{{ gridPrice.startDate || '—' }}</a-descriptions-item>
          <a-descriptions-item label="最晚可租">{{ gridPrice.endDate || '—' }}</a-descriptions-item>
          <a-descriptions-item label="价格">
            <span class="price">¥{{ Number(gridPrice.price || 0).toFixed(2) }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="租用类型">{{ gridPrice.leaseType === 1 ? '月租' : `类型 ${gridPrice.leaseType ?? '—'}` }}</a-descriptions-item>
        </a-descriptions>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  autoCheckoutStudyRoomCabinet,
  getStudyRoomCabinetGridPrice,
  listStudyRoomCabinet,
  listStudyRoomCabinetGrid,
  listStudyRoomCabinetLeaseOrder,
  listStudyRoomUserGrid,
  listStudyRoomVenue,
  openStudyRoomCabinet,
} from '@/apis/study'
import type {
  StudyRoomCabinetGridPriceResp,
  StudyRoomCabinetGridResp,
  StudyRoomCabinetLeaseOrderResp,
  StudyRoomCabinetUserGridResp,
  StudyRoomCabinetVenueResp,
} from '@/apis/study/type'

defineOptions({ name: 'StudyRoomCabinet' })

const loading = ref(false)
const priceLoading = ref(false)
const venueId = ref<number>()
const cabinetId = ref<number>()
const venueList = ref<Array<{ id: number, venueName: string }>>([])
const cabinets = ref<StudyRoomCabinetVenueResp[]>([])
const grids = ref<StudyRoomCabinetGridResp[]>([])
const myGrids = ref<StudyRoomCabinetUserGridResp[]>([])
const leaseOrders = ref<StudyRoomCabinetLeaseOrderResp[]>([])
const priceVisible = ref(false)
const gridPrice = ref<StudyRoomCabinetGridPriceResp>()

const venueOptions = computed(() => venueList.value.map((item) => ({
  label: item.venueName,
  value: item.id,
})))

const cabinetOptions = computed(() => cabinets.value.map((item) => ({
  label: item.cabinetName || `柜体 ${item.cabinetId}`,
  value: item.cabinetId,
})))

const currentCabinet = computed(() => cabinets.value.find((item) => item.cabinetId === cabinetId.value))

const orderColumns: TableInstance['columns'] = [
  { title: '订单 / 租约', dataIndex: 'order', slotName: 'order', width: 150 },
  { title: '门店', dataIndex: 'venueName', minWidth: 140, ellipsis: true, tooltip: true },
  { title: '柜号', dataIndex: 'cabinetNo', width: 100 },
  { title: '租期', dataIndex: 'leaseRange', slotName: 'leaseRange', minWidth: 190 },
  { title: '金额', dataIndex: 'priceYuan', slotName: 'priceYuan', width: 100, align: 'right' },
  { title: '支付状态', dataIndex: 'payStateStr', slotName: 'payStateStr', width: 100, align: 'center' },
  { title: '创建时间', dataIndex: 'createTimeStr', width: 160 },
]

function gridStatus(grid: StudyRoomCabinetGridResp) {
  if (grid.gridStatus === 0) return 'free'
  if (grid.gridStatus === 1) return 'leased'
  if (grid.gridStatus === 2) return 'broken'
  return 'free'
}

function gridClass(grid: StudyRoomCabinetGridResp) {
  return gridStatus(grid)
}

function gridStatusLabel(grid: StudyRoomCabinetGridResp) {
  return ({ 0: '空闲', 1: '已租', 2: '异常' } as Record<number, string>)[grid.gridStatus ?? -1] ?? `状态 ${grid.gridStatus ?? '—'}`
}

async function loadVenues() {
  const { data } = await listStudyRoomVenue()
  venueList.value = data?.venueList ?? []
  if (!venueId.value) venueId.value = venueList.value[0]?.id
}

async function loadCabinets() {
  if (!venueId.value) return
  const { data } = await listStudyRoomCabinet(venueId.value)
  cabinets.value = data?.list ?? []
  if (!cabinets.value.some((item) => item.cabinetId === cabinetId.value)) {
    cabinetId.value = cabinets.value[0]?.cabinetId
  }
  await loadGrids()
}

async function loadGrids() {
  if (!cabinetId.value) {
    grids.value = []
    return
  }
  const { data } = await listStudyRoomCabinetGrid(cabinetId.value)
  grids.value = data?.list ?? []
}

async function loadMyGrids() {
  if (!venueId.value) return
  const { data } = await listStudyRoomUserGrid(venueId.value)
  myGrids.value = data?.list ?? []
}

async function loadOrders() {
  const { data } = await listStudyRoomCabinetLeaseOrder()
  leaseOrders.value = data?.list ?? []
}

async function loadAll() {
  loading.value = true
  try {
    await loadVenues()
    await Promise.all([loadMyGrids(), loadOrders()])
    await loadCabinets()
  } finally {
    loading.value = false
  }
}

async function onVenueChange() {
  cabinetId.value = undefined
  loading.value = true
  try {
    await Promise.all([loadCabinets(), loadMyGrids(), loadOrders()])
  } finally {
    loading.value = false
  }
}

async function showPrice(grid: StudyRoomCabinetGridResp) {
  priceVisible.value = true
  priceLoading.value = true
  gridPrice.value = undefined
  try {
    const { data } = await getStudyRoomCabinetGridPrice(grid.gridId)
    gridPrice.value = data
  } finally {
    priceLoading.value = false
  }
}

function openLock(grid: StudyRoomCabinetUserGridResp) {
  Modal.warning({
    title: '储物柜开锁',
    content: `确定打开柜格「${grid.gripCode || grid.gripId}」？`,
    hideCancel: false,
    maskClosable: false,
    onBeforeOk: async () => {
      await openStudyRoomCabinet({ gripId: grid.gripId })
      Message.success('开锁指令已发送')
      await loadMyGrids()
      return true
    },
  })
}

function onCheckout(grid: StudyRoomCabinetUserGridResp) {
  if (!grid.lastLeaseId) return
  Modal.warning({
    title: '自动退租',
    content: `将按最近一次租约办理退租，柜格会恢复在售。确定退租「${grid.gripCode || grid.gripId}」？`,
    okButtonProps: { status: 'danger' },
    hideCancel: false,
    maskClosable: false,
    onBeforeOk: async () => {
      await autoCheckoutStudyRoomCabinet(grid.lastLeaseId as number)
      Message.success('退租申请已提交')
      await Promise.all([loadMyGrids(), loadCabinets(), loadOrders()])
      return true
    },
  })
}

onMounted(loadAll)
</script>

<style scoped lang="scss">
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

.mono {
  font-variant-numeric: tabular-nums;
}

.legend {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--color-text-2);
}

.legend > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid var(--color-border-2);
  display: inline-block;
}

.swatch.free {
  background: rgb(var(--green-1));
  border-color: rgb(var(--green-4));
}

.swatch.leased {
  background: rgb(var(--primary-1));
  border-color: rgb(var(--primary-4));
}

.swatch.broken {
  background: rgb(var(--red-1));
  border-color: rgb(var(--red-4));
}

.cabinet-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 6px;
}

.cabinet-cell {
  min-height: 38px;
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  background: var(--color-fill-2);
  color: var(--color-text-3);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.14s ease, border-color 0.14s ease;
}

.cabinet-cell:hover {
  transform: translateY(-1px);
  border-color: rgb(var(--primary-6));
}

.cabinet-cell.free {
  background: rgb(var(--green-1));
  border-color: rgb(var(--green-3));
  color: rgb(var(--green-7));
}

.cabinet-cell.leased {
  background: rgb(var(--primary-1));
  border-color: rgb(var(--primary-3));
  color: rgb(var(--primary-7));
}

.cabinet-cell.broken {
  background: rgb(var(--red-1));
  border-color: rgb(var(--red-3));
  color: rgb(var(--red-7));
}

.my-grid-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.my-grid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
}

.my-grid-info {
  min-width: 0;
}

.price {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-1);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 720px) {
  .cabinet-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}
</style>
