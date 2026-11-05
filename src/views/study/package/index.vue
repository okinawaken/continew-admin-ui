<template>
  <div class="gi_page">
    <a-card :bordered="false" class="gi_card_title" title="套餐">
      <template #extra>
        <a-space>
          <a-button :loading="loading" @click="loadPackages">
            <template #icon><icon-refresh /></template>
            <template #default>刷新</template>
          </a-button>
          <a-button type="primary" @click="onBuyTip">
            <template #icon><icon-book /></template>
            <template #default>购买套餐</template>
          </a-button>
        </a-space>
      </template>

      <div class="toolbar">
        <a-input-search v-model="keyword" placeholder="搜索套餐名称" allow-clear style="width: 220px" />
        <a-select
          v-model="venueId"
          placeholder="请选择门店"
          :options="venueOptions"
          allow-search
          style="width: 190px"
          @change="onVenueChange"
        />
        <a-select
          v-model="packageType"
          placeholder="全部类型"
          :options="packageTypeOptions"
          allow-clear
          style="width: 150px"
          @change="loadPackages"
        />
        <a-select
          v-model="packageLabelId"
          placeholder="全部标签"
          :options="packageLabelOptions"
          allow-clear
          style="width: 150px"
          @change="loadPackages"
        />
        <a-select
          v-model="seatAreaId"
          placeholder="全部区域"
          :options="seatAreaOptions"
          allow-clear
          style="width: 150px"
          @change="loadPackages"
        />
        <a-button type="primary" :loading="loading" @click="loadPackages">查询</a-button>
      </div>

      <a-spin :loading="loading" style="display: block">
        <a-row v-if="filteredPackages.length" :gutter="14">
          <a-col v-for="pkg in filteredPackages" :key="pkg.id" :xs="24" :md="12" :xl="8">
            <a-card hoverable class="package-card" :bordered="true">
              <div class="package-top">
                <div class="package-icon">
                  <img v-if="pkg.packageImgPath" :src="pkg.packageImgPath" alt="">
                  <icon-book v-else />
                </div>
                <div class="package-info">
                  <div class="package-name">{{ pkg.packageName }}</div>
                  <div class="package-type">{{ pkg.packageTypeStr || '套餐' }}</div>
                </div>
                <a-tag v-if="pkg.specialTag" color="arcoblue" size="small">{{ pkg.specialTag }}</a-tag>
              </div>

              <div class="price-row">
                <span class="price"><small>¥</small>{{ pkg.packageAccountPriceYuan ?? '—' }}</span>
                <span v-if="pkg.originalPriceYuan" class="price-old">¥{{ pkg.originalPriceYuan }}</span>
              </div>

              <div class="package-desc">{{ pkg.packageDesc || '暂无套餐说明' }}</div>

              <div class="package-foot">
                <a-button size="small" @click="showDetail(pkg)">查看详情</a-button>
                <span class="package-tip">购买需在小程序支付</span>
              </div>
            </a-card>
          </a-col>
        </a-row>
        <a-empty v-else description="当前筛选条件下没有套餐" />
      </a-spin>
    </a-card>

    <a-drawer v-model:visible="detailVisible" :width="width >= 680 ? 620 : '100%'" :footer="false">
      <template #title>
        <div>
          <div>{{ detail?.packageName || '套餐详情' }}</div>
          <div class="drawer-sub">{{ detail?.packageTypeStr || '—' }}</div>
        </div>
      </template>

      <a-spin :loading="detailLoading" style="display: block">
        <template v-if="detail">
          <div class="detail-price">
            <span class="price"><small>¥</small>{{ detail.packageAccountPriceYuan ?? '—' }}</span>
            <span v-if="detail.originalPriceYuan" class="price-old">¥{{ detail.originalPriceYuan }}</span>
            <a-tag v-if="detail.maxPerBuyNum" size="small">限购 {{ detail.maxPerBuyNum }} 份</a-tag>
          </div>

          <a-descriptions :column="1" size="medium">
            <a-descriptions-item label="套餐类型">{{ detail.packageTypeStr || '—' }}</a-descriptions-item>
            <a-descriptions-item label="可用时长">{{ detail.consumeUseNumDesc || '—' }}</a-descriptions-item>
            <a-descriptions-item label="有效期">{{ detail.validTimeDesc || '—' }}</a-descriptions-item>
            <a-descriptions-item label="可用时段">{{ detail.settleHourDesc || '—' }}</a-descriptions-item>
            <a-descriptions-item label="可用区域">{{ detail.useAreasDesc || '—' }}</a-descriptions-item>
            <a-descriptions-item label="限购说明">{{ detail.buyPerNumDesc || '—' }}</a-descriptions-item>
            <a-descriptions-item label="不可用日期">{{ detail.failureDateDesc || '无' }}</a-descriptions-item>
            <a-descriptions-item label="不可用星期">{{ detail.failureWeekdayDesc || '无' }}</a-descriptions-item>
            <a-descriptions-item label="不可用节假日">{{ detail.failureHolidayDesc || '无' }}</a-descriptions-item>
          </a-descriptions>

          <a-divider>套餐说明</a-divider>
          <p class="detail-desc">{{ detail.packageDesc || '暂无套餐说明' }}</p>

          <a-divider>可用门店</a-divider>
          <div v-if="detail.venueList?.length" class="venue-list">
            <div v-for="venue in detail.venueList" :key="venue.id" class="venue-item">
              <div>
                <div class="cell-main">{{ venue.venueName || `门店 ${venue.id}` }}</div>
                <div class="cell-sub">{{ venue.venueAddress || '—' }}</div>
              </div>
              <a-space :size="4" wrap>
                <a-tag v-for="area in venue.venueAreaList || []" :key="area.id" size="small">
                  {{ area.areaName }}
                </a-tag>
              </a-space>
            </div>
          </div>
          <span v-else class="cell-muted">暂无可用门店信息</span>
        </template>
      </a-spin>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import {
  getStudyRoomPackageDetail,
  getStudyRoomPackageOpt,
  listStudyRoomPackage,
  listStudyRoomPackageLabel,
  listStudyRoomVenue,
} from '@/apis/study'
import type {
  StudyRoomBuyV2PackageDetailResp,
  StudyRoomBuyV2PackageOptResp,
  StudyRoomPackageItemResp,
} from '@/apis/study/type'
import { getStudyRoomLocation } from '@/features/study-room'

defineOptions({ name: 'StudyRoomPackage' })

const { width } = useWindowSize()

const loading = ref(false)
const detailLoading = ref(false)
const keyword = ref('')
const venueId = ref<number>()
const packageType = ref<number>()
const packageLabelId = ref<number>()
const seatAreaId = ref<number>()
const venueList = ref<Array<{ id: number, venueName: string }>>([])
const opt = ref<StudyRoomBuyV2PackageOptResp>()
const packageLabelList = ref<Array<{ id: number, name: string }>>([])
const seatAreaList = ref<Array<{ id: number, name: string }>>([])
const packages = ref<StudyRoomPackageItemResp[]>([])
const detailVisible = ref(false)
const detail = ref<StudyRoomBuyV2PackageDetailResp>()

const venueOptions = computed(() => venueList.value.map((item) => ({
  label: item.venueName,
  value: item.id,
})))

const packageTypeOptions = computed(() => (opt.value?.packageTypeList ?? []).map((item) => ({
  label: item.name,
  value: Number(item.id),
})))

const packageLabelOptions = computed(() => {
  const list = packageLabelList.value.length ? packageLabelList.value : (opt.value?.packageLabelList ?? [])
  return list.map((item) => ({ label: item.name, value: Number(item.id) }))
})

const seatAreaOptions = computed(() => seatAreaList.value.map((item) => ({
  label: item.name,
  value: Number(item.id),
})))

const filteredPackages = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return packages.value
  return packages.value.filter((item) =>
    item.packageName?.toLowerCase().includes(key)
    || item.packageDesc?.toLowerCase().includes(key),
  )
})

async function loadOptions() {
  // 上游按经纬度筛选可用门店与套餐
  const location = await getStudyRoomLocation()
  const [venueRes, optRes] = await Promise.all([
    listStudyRoomVenue(),
    getStudyRoomPackageOpt(location),
  ])
  venueList.value = venueRes.data?.venueList ?? []
  opt.value = optRes.data
  if (!venueId.value) venueId.value = venueList.value[0]?.id
  await loadLabels()
}

async function loadLabels() {
  if (!venueId.value) return
  const { data } = await listStudyRoomPackageLabel(venueId.value)
  packageLabelList.value = data?.packageLabelList ?? []
  seatAreaList.value = data?.seatAreaList ?? []
}

async function loadPackages() {
  loading.value = true
  try {
    const { data } = await listStudyRoomPackage({
      venueId: venueId.value,
      packageType: packageType.value,
      packageLabelIds: packageLabelId.value ? [packageLabelId.value] : undefined,
      seatAreaId: seatAreaId.value,
    })
    packages.value = data?.packageList ?? []
  } finally {
    loading.value = false
  }
}

async function onVenueChange() {
  packageLabelId.value = undefined
  seatAreaId.value = undefined
  await loadLabels()
  await loadPackages()
}

function onBuyTip() {
  Message.info('套餐购买需在小程序内完成微信支付，后台只做目录与详情代理')
}

async function showDetail(pkg: StudyRoomPackageItemResp) {
  detailVisible.value = true
  detail.value = undefined
  detailLoading.value = true
  try {
    const { data } = await getStudyRoomPackageDetail(pkg.id)
    detail.value = data
  } finally {
    detailLoading.value = false
  }
}

onMounted(async () => {
  await loadOptions()
  await loadPackages()
})
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.package-card {
  margin-bottom: 14px;
}

.package-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.package-icon {
  width: 42px;
  height: 42px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  flex: none;
  overflow: hidden;
  background: rgb(var(--primary-1));
  color: rgb(var(--primary-6));
  font-size: 20px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.package-info {
  min-width: 0;
  flex: 1;
}

.package-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
}

.package-type {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-3);
}

.price-row,
.detail-price {
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin-top: 12px;
}

.price {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-1);
  font-variant-numeric: tabular-nums;

  small {
    font-size: 13px;
    margin-right: 1px;
  }
}

.price-old {
  color: var(--color-text-3);
  font-size: 12px;
  text-decoration: line-through;
}

.package-desc {
  min-height: 38px;
  margin-top: 10px;
  color: var(--color-text-2);
  font-size: 12px;
  line-height: 1.6;
}

.package-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.package-tip,
.drawer-sub,
.cell-sub,
.cell-muted {
  color: var(--color-text-3);
  font-size: 12px;
}

.drawer-sub {
  margin-top: 2px;
  font-weight: 400;
}

.detail-desc {
  margin: 0;
  color: var(--color-text-2);
  font-size: 13px;
  line-height: 1.7;
}

.venue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.venue-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
}

.cell-main {
  font-weight: 600;
  color: var(--color-text-1);
}
</style>
