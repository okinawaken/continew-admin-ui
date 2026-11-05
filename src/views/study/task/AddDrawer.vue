<template>
  <a-drawer
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 640 ? 560 : '100%'"
    @before-ok="save"
    @close="reset"
  >
    <a-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :layout="width >= 640 ? 'horizontal' : 'vertical'"
      auto-label-width
      size="large"
    >
      <a-form-item label="门店" field="venueId">
        <a-select
          v-model="form.venueId"
          placeholder="请选择门店"
          :options="venueOptions"
          allow-search
          @change="onVenueChange"
        />
      </a-form-item>

      <a-form-item label="选座方式" field="seatMode">
        <a-radio-group v-model="form.seatMode" type="button" @change="onModeChange">
          <a-radio value="seat">指定座位</a-radio>
          <a-radio value="area">偏好区域</a-radio>
          <a-radio value="any">不限</a-radio>
        </a-radio-group>
        <template #extra>
          <span class="tip">指定座位失败后，可再配置一条偏好区域任务作为兜底。</span>
        </template>
      </a-form-item>

      <a-form-item v-if="form.seatMode === 'seat'" label="座位" field="seatId">
        <a-select
          v-model="form.seatId"
          placeholder="请选择座位"
          :options="seatOptions"
          :loading="seatLoading"
          allow-search
          @change="onSeatChange"
        />
      </a-form-item>

      <a-form-item v-if="form.seatMode === 'area'" label="偏好区域" field="areaId">
        <a-select
          v-model="form.areaId"
          placeholder="请选择区域"
          :options="areaOptions"
          allow-search
          @change="onAreaChange"
        />
      </a-form-item>

      <a-form-item label="查询日期" field="reserveDate">
        <a-date-picker
          v-model="form.reserveDate"
          value-format="YYYY-MM-DD"
          placeholder="用于加载当天座位"
          style="width: 100%"
          @change="loadSeats"
        />
        <template #extra>
          <span class="tip">仅用于加载座位图，不会保存到任务规则。</span>
        </template>
      </a-form-item>

      <a-form-item label="期望时段" required>
        <a-space>
          <a-time-picker
            v-model="form.reserveStartTime"
            format="HH:mm"
            placeholder="开始时间"
            style="width: 140px"
            @change="loadSeats"
          />
          <span class="muted">至</span>
          <a-time-picker
            v-model="form.reserveEndTime"
            format="HH:mm"
            placeholder="结束时间"
            style="width: 140px"
            @change="loadSeats"
          />
        </a-space>
      </a-form-item>

      <a-form-item label="执行星期" field="weekDays">
        <a-checkbox-group v-model="form.weekDays" :options="weekDayOptions" />
      </a-form-item>

      <a-alert v-if="isUpdate" type="info">
        保存后会沿用当前规则的启用状态；暂停中的任务恢复后才会参与下一次放号。
      </a-alert>
    </a-form>
  </a-drawer>
</template>

<script setup lang="ts">
import type { FormInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import dayjs from 'dayjs'
import {
  addStudyRoomTask,
  listStudyRoomArea,
  listStudyRoomSeat,
  listStudyRoomVenue,
  updateStudyRoomTask,
} from '@/apis/study'
import type {
  StudyRoomAreaResp,
  StudyRoomAutoReserveTaskReq,
  StudyRoomAutoReserveTaskResp,
  StudyRoomSeatResp,
  StudyRoomVenueSimpleResp,
} from '@/apis/study/type'

defineOptions({ name: 'StudyRoomTaskAddDrawer' })

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const visible = ref(false)
const dataId = ref<number>()
const isUpdate = computed(() => Boolean(dataId.value))
const title = computed(() => (isUpdate.value ? '编辑自动预约任务' : '新建自动预约任务'))
const formRef = ref<FormInstance>()

const venueList = ref<StudyRoomVenueSimpleResp[]>([])
const areaList = ref<StudyRoomAreaResp[]>([])
const seatList = ref<StudyRoomSeatResp[]>([])
const seatLoading = ref(false)
const optionsLoaded = ref(false)
const optionsLoading = ref(false)

const venueOptions = computed(() => venueList.value.map((item) => ({ label: item.venueName, value: item.id })))
const areaOptions = computed(() => areaList.value.map((item) => ({ label: item.areaName, value: item.id })))
const seatOptions = computed(() => seatList.value.map((item) => ({
  label: `${item.seatNumber}${item.seatReserveDesc ? ` · ${item.seatReserveDesc}` : ''}`,
  value: item.id,
})))

const weekDayOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
]

interface FormState {
  venueId?: number
  seatMode: 'seat' | 'area' | 'any'
  seatId?: number
  seatNumber?: string
  areaId?: number
  areaName?: string
  reserveDate: string
  reserveStartTime: string
  reserveEndTime: string
  weekDays: number[]
}

const form = reactive<FormState>(createDefaultForm())

const rules = {
  venueId: [{ required: true, message: '请选择门店' }],
  seatId: [{ required: true, message: '请选择座位' }],
  areaId: [{ required: true, message: '请选择区域' }],
  reserveStartTime: [{ required: true, message: '请选择开始时间' }],
  reserveEndTime: [{ required: true, message: '请选择结束时间' }],
  weekDays: [{
    validator: (value: number[], callback: (msg?: string) => void) => {
      if (!value?.length) callback('请至少选择一个执行星期')
      else callback()
    },
  }],
}

function createDefaultForm(): FormState {
  return {
    venueId: undefined,
    seatMode: 'any',
    seatId: undefined,
    seatNumber: '',
    areaId: undefined,
    areaName: '',
    reserveDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    reserveStartTime: '08:00',
    reserveEndTime: '22:00',
    weekDays: [1, 2, 3, 4, 5],
  }
}

function reset() {
  formRef.value?.clearValidate()
  Object.assign(form, createDefaultForm())
  dataId.value = undefined
}

async function loadOptions() {
  if (optionsLoaded.value || optionsLoading.value) return
  optionsLoading.value = true
  try {
    const [venueRes, areaRes] = await Promise.all([listStudyRoomVenue(), listStudyRoomArea()])
    venueList.value = venueRes.data?.venueList ?? []
    areaList.value = areaRes.data?.areaList ?? []
    optionsLoaded.value = true
  } finally {
    optionsLoading.value = false
  }
}

async function loadSeats() {
  if (form.seatMode !== 'seat' || !form.venueId) {
    seatList.value = []
    return
  }
  if (!form.reserveDate) return
  seatLoading.value = true
  try {
    const { data } = await listStudyRoomSeat({
      venueId: form.venueId,
      reserveDateStr: form.reserveDate,
      reserveStartTimeStr: normalizeTime(form.reserveStartTime),
      reserveEndTimeStr: normalizeTime(form.reserveEndTime),
    })
    const seats: StudyRoomSeatResp[] = []
    for (const area of data?.venueAreaList ?? []) {
      for (const seat of area.venueAreaSeatList ?? []) {
        seats.push({
          ...seat,
          areaId: area.id,
          areaName: area.areaName,
        } as StudyRoomSeatResp & { areaId: number, areaName: string })
      }
    }
    seatList.value = seats
    if (isUpdate.value && form.seatId && !seats.some((item) => item.id === form.seatId)) {
      const fallback = {
        id: form.seatId,
        seatNumber: form.seatNumber || String(form.seatId),
        areaId: form.areaId,
        areaName: form.areaName,
      } as StudyRoomSeatResp & { areaId?: number, areaName?: string }
      seatList.value = [fallback, ...seats]
    }
  } finally {
    seatLoading.value = false
  }
}

function normalizeTime(value?: string | number | Date) {
  if (!value) return ''
  if (typeof value !== 'string') return dayjs(value).format('HH:mm')
  const [hour = '00', minute = '00'] = value.split(':')
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
}

function onVenueChange() {
  form.seatId = undefined
  form.seatNumber = ''
  form.areaId = undefined
  form.areaName = ''
  seatList.value = []
  if (form.seatMode === 'seat') loadSeats()
}

function onModeChange() {
  if (form.seatMode !== 'seat') {
    form.seatId = undefined
    form.seatNumber = ''
  }
  if (form.seatMode !== 'area') {
    form.areaId = undefined
    form.areaName = ''
  }
  if (form.seatMode === 'seat') loadSeats()
}

function onSeatChange(value?: number) {
  const seat = seatList.value.find((item) => item.id === value) as
    | (StudyRoomSeatResp & { areaId?: number, areaName?: string })
    | undefined
  if (!seat) {
    form.seatNumber = ''
    form.areaId = undefined
    form.areaName = ''
    return
  }
  form.seatNumber = seat.seatNumber
  form.areaId = seat.areaId
  form.areaName = seat.areaName
}

function onAreaChange(value?: number) {
  const area = areaList.value.find((item) => item.id === value)
  form.areaName = area?.areaName ?? ''
}

async function onAdd() {
  reset()
  await loadOptions()
  form.venueId = venueList.value[0]?.id
  visible.value = true
}

async function onUpdate(record: StudyRoomAutoReserveTaskResp) {
  reset()
  await loadOptions()
  dataId.value = record.id
  form.venueId = record.venueId
  form.reserveStartTime = record.reserveStartTime?.slice(0, 5) || '08:00'
  form.reserveEndTime = record.reserveEndTime?.slice(0, 5) || '22:00'
  form.weekDays = record.weekDays?.length ? [...record.weekDays] : [1, 2, 3, 4, 5]
  form.seatId = record.seatId && record.seatId > 0 ? record.seatId : undefined
  form.seatNumber = record.seatNumber || ''
  form.areaId = record.areaId && record.areaId > 0 ? record.areaId : undefined
  form.areaName = record.areaName || ''
  form.seatMode = form.seatId ? 'seat' : (form.areaId ? 'area' : 'any')
  if (form.seatMode === 'seat') {
    // 座位图按最新日期加载；历史座位不存在时 loadSeats 会补一个回退选项。
    form.reserveDate = record.lastMaxReserveDate || dayjs().add(1, 'day').format('YYYY-MM-DD')
  }
  visible.value = true
  if (form.seatMode === 'seat') await loadSeats()
}

function buildPayload(): StudyRoomAutoReserveTaskReq {
  const isSeat = form.seatMode === 'seat'
  const isArea = form.seatMode === 'area'
  return {
    venueId: form.venueId,
    seatId: isSeat ? form.seatId : 0,
    seatNumber: isSeat ? form.seatNumber || '' : '',
    areaId: isSeat || isArea ? form.areaId : 0,
    areaName: isSeat || isArea ? form.areaName || '' : '',
    reserveStartTime: normalizeTime(form.reserveStartTime),
    reserveEndTime: normalizeTime(form.reserveEndTime),
    weekDays: [...form.weekDays].sort((a, b) => a - b),
  }
}

async function save() {
  const invalid = await formRef.value?.validate()
  if (invalid) return false
  const payload = buildPayload()
  if (isUpdate.value && dataId.value) {
    await updateStudyRoomTask(payload, dataId.value)
    Message.success('修改成功')
  } else {
    await addStudyRoomTask(payload)
    Message.success('新增成功')
  }
  emit('save-success')
  visible.value = false
  return true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss">
.tip {
  color: var(--color-text-3);
  font-size: 12px;
}

.muted {
  color: var(--color-text-3);
}
</style>
