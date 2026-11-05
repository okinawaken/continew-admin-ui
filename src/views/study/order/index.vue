<template>
  <div class="gi_page">
    <a-row :gutter="14" class="stat-row">
      <a-col :xs="12" :md="8">
        <a-card :bordered="false"><div class="stat-label">订单总数</div><div class="stat-value">{{ orders.length }}<small> 笔</small></div></a-card>
      </a-col>
      <a-col :xs="12" :md="8">
        <a-card :bordered="false"><div class="stat-label">已支付金额</div><div class="stat-value"><small>¥</small>{{ paidAmount.toFixed(2) }}</div></a-card>
      </a-col>
      <a-col :xs="12" :md="8">
        <a-card :bordered="false"><div class="stat-label">待支付</div><div class="stat-value">{{ pendingCount }}<small> 笔</small></div></a-card>
      </a-col>
    </a-row>

    <a-card :bordered="false" class="gi_card_title" title="订单">
      <template #extra>
        <a-button :loading="loading" @click="load">
          <template #icon><icon-refresh /></template>
          <template #default>刷新</template>
        </a-button>
      </template>

      <div class="toolbar">
        <a-input-search v-model="keyword" placeholder="搜索订单号 / 套餐" allow-clear style="width: 240px" />
        <a-radio-group v-model="tab" type="button" :options="tabOptions" />
        <span class="toolbar-tip">共 {{ filteredOrders.length }} 笔 · 支付状态以小程序订单为准</span>
      </div>

      <a-spin :loading="loading" style="display: block">
        <a-table
          row-key="id"
          :data="filteredOrders"
          :columns="columns"
          :pagination="{ pageSize: 10, showTotal: true, showPageSize: true }"
          :scroll="{ x: 1040 }"
        >
          <template #orderNumber="{ record }">
            <span class="mono">{{ record.orderNumber || '—' }}</span>
          </template>
          <template #packageName="{ record }">
            <div class="cell-main">{{ record.packageName || '—' }}</div>
            <div class="cell-sub">{{ record.payTypeStr || '—' }}</div>
          </template>
          <template #payPrice="{ record }">
            <span class="mono">¥{{ formatMoney(record.payPrice) }}</span>
          </template>
          <template #payRealMoney="{ record }">
            <span class="mono">¥{{ formatMoney(record.payRealMoney) }}</span>
          </template>
          <template #discountPrice="{ record }">
            <span class="mono">{{ record.discountPrice ? `¥${formatMoney(record.discountPrice)}` : '—' }}</span>
          </template>
          <template #payStateStr="{ record }">
            <a-tag :color="payStateColor(record.payStateStr)" size="small">{{ record.payStateStr || '未知' }}</a-tag>
          </template>
          <template #action="{ record }">
            <a-link @click="showDetail(record)">详情</a-link>
          </template>
          <template #empty>
            <a-empty description="暂无订单记录" />
          </template>
        </a-table>
      </a-spin>
    </a-card>

    <a-drawer v-model:visible="detailVisible" :width="width >= 640 ? 560 : '100%'" :footer="false">
      <template #title>
        <div>
          <div>订单详情</div>
          <div class="drawer-sub mono">{{ currentOrder?.orderNumber || '—' }}</div>
        </div>
      </template>

      <template v-if="currentOrder">
        <div class="order-status">
          <a-tag :color="payStateColor(currentOrder.payStateStr)" size="medium">
            {{ currentOrder.payStateStr || '未知' }}
          </a-tag>
          <span class="toolbar-tip">下单 {{ currentOrder.buyTimeStr || '—' }}</span>
        </div>

        <a-descriptions :column="1" size="medium">
          <a-descriptions-item label="套餐">{{ currentOrder.packageName || '—' }}</a-descriptions-item>
          <a-descriptions-item label="套餐总价">¥{{ formatMoney(currentOrder.packagePriceTotal) }}</a-descriptions-item>
          <a-descriptions-item label="应付金额">¥{{ formatMoney(currentOrder.payPrice) }}</a-descriptions-item>
          <a-descriptions-item label="实付金额">¥{{ formatMoney(currentOrder.payRealMoney) }}</a-descriptions-item>
          <a-descriptions-item label="优惠金额">¥{{ formatMoney(currentOrder.discountPrice) }}</a-descriptions-item>
          <a-descriptions-item label="支付方式">{{ currentOrder.payTypeStr || '—' }}</a-descriptions-item>
          <a-descriptions-item label="支付流水号">{{ currentOrder.payNumber || '—' }}</a-descriptions-item>
          <a-descriptions-item label="支付时间">{{ currentOrder.payTimeStr || '—' }}</a-descriptions-item>
        </a-descriptions>

        <a-divider>订单时间线</a-divider>
        <a-timeline>
          <a-timeline-item dot-color="green">
            <div class="cell-main">创建订单</div>
            <div class="cell-sub">{{ currentOrder.createTimeStr || currentOrder.buyTimeStr || '—' }}</div>
          </a-timeline-item>
          <a-timeline-item v-if="currentOrder.payTimeStr" dot-color="green">
            <div class="cell-main">支付完成</div>
            <div class="cell-sub">{{ currentOrder.payTimeStr }}</div>
          </a-timeline-item>
          <a-timeline-item v-else dot-color="orange">
            <div class="cell-main">等待支付</div>
            <div class="cell-sub">请在小程序内完成支付</div>
          </a-timeline-item>
        </a-timeline>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { listStudyRoomOrder } from '@/apis/study'
import type { StudyRoomUserOrderResp } from '@/apis/study/type'

defineOptions({ name: 'StudyRoomOrder' })

const { width } = useWindowSize()

const loading = ref(false)
const keyword = ref('')
const tab = ref<'all' | 'pending' | 'paid' | 'closed'>('all')
const orders = ref<StudyRoomUserOrderResp[]>([])
const detailVisible = ref(false)
const currentOrder = ref<StudyRoomUserOrderResp>()

const tabOptions = [
  { label: '全部', value: 'all' },
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '已关闭', value: 'closed' },
]

const pendingCount = computed(() => orders.value.filter((item) => item.payStateStr?.includes('待支付')).length)
const paidAmount = computed(() => orders.value
  .filter((item) => item.payStateStr?.includes('已支付'))
  .reduce((sum, item) => sum + Number(item.payRealMoney || 0), 0))

const filteredOrders = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return orders.value.filter((item) => {
    const matchKeyword = !key
      || item.orderNumber?.toLowerCase().includes(key)
      || item.packageName?.toLowerCase().includes(key)
    const status = item.payStateStr || ''
    const matchTab = tab.value === 'all'
      || (tab.value === 'pending' && status.includes('待支付'))
      || (tab.value === 'paid' && status.includes('已支付'))
      || (tab.value === 'closed' && (status.includes('已关闭') || status.includes('已退款')))
    return matchKeyword && matchTab
  })
})

const columns: TableInstance['columns'] = [
  { title: '订单号', dataIndex: 'orderNumber', slotName: 'orderNumber', width: 190 },
  { title: '套餐', dataIndex: 'packageName', slotName: 'packageName', minWidth: 160 },
  { title: '应付', dataIndex: 'payPrice', slotName: 'payPrice', width: 110, align: 'right' },
  { title: '实付', dataIndex: 'payRealMoney', slotName: 'payRealMoney', width: 110, align: 'right' },
  { title: '优惠', dataIndex: 'discountPrice', slotName: 'discountPrice', width: 100, align: 'right' },
  { title: '状态', dataIndex: 'payStateStr', slotName: 'payStateStr', width: 100, align: 'center' },
  { title: '下单时间', dataIndex: 'buyTimeStr', width: 160 },
  { title: '操作', dataIndex: 'action', slotName: 'action', width: 80, align: 'center' },
]

function formatMoney(value?: number) {
  return Number(value || 0).toFixed(2)
}

function payStateColor(status?: string) {
  if (status?.includes('待支付')) return 'orange'
  if (status?.includes('已支付')) return 'green'
  if (status?.includes('已退款')) return 'purple'
  return 'gray'
}

async function load() {
  loading.value = true
  try {
    const { data } = await listStudyRoomOrder()
    orders.value = data?.list ?? []
  } finally {
    loading.value = false
  }
}

function showDetail(order: StudyRoomUserOrderResp) {
  currentOrder.value = order
  detailVisible.value = true
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
.cell-sub {
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

.order-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.drawer-sub {
  margin-top: 2px;
  color: var(--color-text-3);
  font-size: 12px;
  font-weight: 400;
}
</style>
