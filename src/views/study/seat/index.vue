<template>
  <div class="gi_page">
    <a-card :bordered="false" class="gi_card_title" title="座位图">
      <template #extra>
        <span class="toolbar-tip">{{ seatMap?.venue?.venueName || '门店座位' }}</span>
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
          v-model="reserveDate"
          placeholder="请选择日期"
          :options="dateOptions"
          style="width: 190px"
          @change="loadSeats"
        />
        <a-select
          v-model="areaFilter"
          placeholder="全部区域"
          :options="areaOptions"
          allow-clear
          style="width: 150px"
        />
        <a-time-picker v-model="startTime" format="HH:mm" placeholder="开始时间" style="width: 130px" />
        <span class="toolbar-tip">至</span>
        <a-time-picker v-model="endTime" format="HH:mm" placeholder="结束时间" style="width: 130px" />
        <a-button type="primary" :loading="loading" @click="loadSeats">
          <template #icon><icon-search /></template>
          <template #default>查询</template>
        </a-button>
        <a-button :loading="loading" @click="loadSeats">
          <template #icon><icon-refresh /></template>
          <template #default>刷新</template>
        </a-button>
      </div>

      <a-spin :loading="loading" style="display: block">
        <div class="legend">
          <span><i class="swatch free" />空闲</span>
          <span><i class="swatch part" />部分可约</span>
          <span><i class="swatch disabled" />不可预约</span>
          <span><i class="swatch selected" />当前选中</span>
          <span class="legend-tip">
            保留 {{ seatMap?.reserveHoldMinutes || '—' }} 分钟 · 取消上限 {{ seatMap?.reserveCancelLimit || '—' }} 次
          </span>
        </div>

        <a-row :gutter="14">
          <a-col :xs="24" :xl="16">
            <div v-if="visibleAreas.length" class="area-list">
              <div v-for="area in visibleAreas" :key="area.id" class="area-block">
                <div class="area-head">
                  <span class="area-name">{{ area.areaName }}</span>
                  <span class="area-meta">{{ area.venueAreaSeatList?.length || 0 }} 个座位</span>
                </div>
                <div class="seat-grid">
                  <button
                    v-for="seat in area.venueAreaSeatList || []"
                    :key="seat.id"
                    type="button"
                    class="seat"
                    :class="[seatClass(seat), { selected: selectedSeat?.id === seat.id }]"
                    :title="`${seat.seatNumber} · ${seatStatusLabel(seat)}`"
                    @click="selectSeat(seat, area)"
                  >
                    {{ seat.seatNumber }}
                  </button>
                </div>
              </div>
            </div>
            <a-empty v-else description="当前条件下没有可展示的座位" />
          </a-col>

          <a-col :xs="24" :xl="8">
            <a-card :bordered="true" title="座位详情" size="small">
              <template v-if="selectedSeat">
                <div class="seat-title">{{ selectedSeat.seatNumber }}</div>
                <div class="seat-sub">{{ selectedArea?.areaName || '—' }} · {{ seatMap?.venue?.venueName || '—' }}</div>
                <a-descriptions :column="1" size="small" style="margin-top: 10px">
                  <a-descriptions-item label="状态">
                    <a-tag :color="seatTagColor(selectedSeat)" size="small">
                      {{ seatStatusLabel(selectedSeat) }}
                    </a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item label="说明">
                    {{ selectedSeat.seatReserveDescReal || selectedSeat.seatReserveDesc || '—' }}
                  </a-descriptions-item>
                  <a-descriptions-item label="最早可约">
                    {{ selectedSeat.minStartTimeStr || '—' }}
                  </a-descriptions-item>
                  <a-descriptions-item label="下一步">
                    {{ selectedSeat.nextReserveDesc || '—' }}
                  </a-descriptions-item>
                </a-descriptions>

                <a-divider>可约时段</a-divider>
                <a-space :size="5" wrap>
                  <a-tag v-for="time in selectedSeat.validTimeStrList || []" :key="time.validTimeStr" size="small" color="green">
                    {{ time.validTimeStr }}
                  </a-tag>
                  <span v-if="!selectedSeat.validTimeStrList?.length" class="toolbar-tip">暂无可用时段</span>
                </a-space>

                <a-divider>今日占用</a-divider>
                <div v-if="selectedSeat.reserveRecordList?.length" class="record-list">
                  <div v-for="record in selectedSeat.reserveRecordList" :key="record.id" class="record-item">
                    <span>{{ record.reserveTimeStr || '—' }}</span>
                    <span class="toolbar-tip">{{ record.reserveMinuteStr || '—' }}</span>
                  </div>
                </div>
                <span v-else class="toolbar-tip">暂无预约占用</span>
              </template>
              <a-empty v-else description="点击座位查看详情" />
            </a-card>
          </a-col>
        </a-row>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { listStudyRoomReserveDate, listStudyRoomSeat, listStudyRoomVenue } from '@/apis/study'
import type { StudyRoomSeatAreaResp, StudyRoomSeatMapResp, StudyRoomSeatResp } from '@/apis/study/type'

defineOptions({ name: 'StudyRoomSeat' })

const loading = ref(false)
const venueList = ref<Array<{ id: number, venueName: string }>>([])
const venueId = ref<number>()
const dateList = ref<string[]>([])
const reserveDate = ref<string>()
const areaFilter = ref<number>()
const startTime = ref('08:00')
const endTime = ref('22:00')
const seatMap = ref<StudyRoomSeatMapResp>()
const selectedSeat = ref<StudyRoomSeatResp>()
const selectedArea = ref<StudyRoomSeatAreaResp>()

const venueOptions = computed(() => venueList.value.map((item) => ({
  label: item.venueName,
  value: item.id,
})))

const dateOptions = computed(() => dateList.value.map((item) => {
  const value = item.split(' ')[0]
  return { label: item, value }
}))

const areaOptions = computed(() => (seatMap.value?.venueAreaList ?? []).map((item) => ({
  label: item.areaName,
  value: item.id,
})))

const visibleAreas = computed(() => {
  const areas = seatMap.value?.venueAreaList ?? []
  return areaFilter.value ? areas.filter((item) => item.id === areaFilter.value) : areas
})

function normalizeTime(value: string | number | Date) {
  if (!value) return ''
  if (typeof value !== 'string') return dayjs(value).format('HH:mm')
  const [hour = '00', minute = '00'] = value.split(':')
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
}

function seatStatus(seat: StudyRoomSeatResp) {
  if (seat.seatReserveState === 10) return 'free'
  if (seat.seatReserveState === 20) return 'part'
  return 'disabled'
}

function seatClass(seat: StudyRoomSeatResp) {
  return seatStatus(seat)
}

function seatStatusLabel(seat: StudyRoomSeatResp) {
  if (seat.seatReserveDesc) return seat.seatReserveDesc
  if (seat.seatReserveState === 10) return '空闲'
  if (seat.seatReserveState === 20) return '部分时段可约'
  return '不可预约'
}

function seatTagColor(seat: StudyRoomSeatResp) {
  if (seat.seatReserveState === 10) return 'green'
  if (seat.seatReserveState === 20) return 'orange'
  return 'gray'
}

async function loadVenues() {
  const { data } = await listStudyRoomVenue()
  venueList.value = data?.venueList ?? []
  if (!venueId.value) venueId.value = venueList.value[0]?.id
}

async function loadDates() {
  if (!venueId.value) return
  const { data } = await listStudyRoomReserveDate(venueId.value)
  dateList.value = data?.reserveDateList ?? []
  if (!dateList.value.length) {
    reserveDate.value = undefined
    seatMap.value = undefined
    return
  }
  const stillExists = dateList.value.some((item) => item.split(' ')[0] === reserveDate.value)
  if (!stillExists) reserveDate.value = dateList.value[0].split(' ')[0]
  await loadSeats()
}

async function loadSeats() {
  if (!venueId.value || !reserveDate.value) {
    seatMap.value = undefined
    return
  }
  loading.value = true
  try {
    const { data } = await listStudyRoomSeat({
      venueId: venueId.value,
      reserveDateStr: reserveDate.value,
      reserveStartTimeStr: normalizeTime(startTime.value),
      reserveEndTimeStr: normalizeTime(endTime.value),
    })
    seatMap.value = data
    selectedSeat.value = undefined
    selectedArea.value = undefined
    if (areaFilter.value && !data?.venueAreaList?.some((item) => item.id === areaFilter.value)) {
      areaFilter.value = undefined
    }
  } finally {
    loading.value = false
  }
}

async function onVenueChange() {
  areaFilter.value = undefined
  selectedSeat.value = undefined
  selectedArea.value = undefined
  await loadDates()
}

function selectSeat(seat: StudyRoomSeatResp, area: StudyRoomSeatAreaResp) {
  selectedSeat.value = seat
  selectedArea.value = area
}

onMounted(async () => {
  await loadVenues()
  await loadDates()
})
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.toolbar-tip {
  color: var(--color-text-3);
  font-size: 12px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  font-size: 12px;
  color: var(--color-text-2);
}

.legend > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.legend-tip {
  margin-left: auto;
  color: var(--color-text-3);
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

.swatch.part {
  background: rgb(var(--orange-1));
  border-color: rgb(var(--orange-4));
}

.swatch.disabled {
  background: var(--color-fill-2);
}

.swatch.selected {
  background: rgb(var(--primary-6));
  border-color: rgb(var(--primary-6));
}

.area-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.area-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.area-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-1);
}

.area-meta {
  font-size: 12px;
  color: var(--color-text-3);
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(44px, 1fr));
  gap: 7px;
  max-width: 560px;
}

.seat {
  min-height: 44px;
  padding: 4px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  background: var(--color-bg-2);
  color: var(--color-text-2);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
}

.seat:hover {
  transform: translateY(-1px);
  border-color: rgb(var(--primary-6));
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.seat.free {
  background: rgb(var(--green-1));
  border-color: rgb(var(--green-3));
  color: rgb(var(--green-7));
}

.seat.part {
  background: rgb(var(--orange-1));
  border-color: rgb(var(--orange-3));
  color: rgb(var(--orange-7));
}

.seat.disabled {
  background: var(--color-fill-2);
  color: var(--color-text-3);
}

.seat.selected {
  background: rgb(var(--primary-6));
  border-color: rgb(var(--primary-6));
  color: #fff;
  box-shadow: 0 0 0 3px rgb(var(--primary-1));
}

.seat-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-1);
}

.seat-sub {
  margin-top: 2px;
  color: var(--color-text-3);
  font-size: 12px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  color: var(--color-text-2);
}
</style>
