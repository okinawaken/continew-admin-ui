<template>
  <div class="gi_page">
    <a-card :bordered="false" class="gi_card_title" title="门店">
      <template #extra>
        <a-space>
          <a-button :loading="loading" @click="load">
            <template #icon><icon-refresh /></template>
            <template #default>刷新</template>
          </a-button>
        </a-space>
      </template>

      <div class="toolbar">
        <a-input-search
          v-model="keyword"
          placeholder="搜索门店名称或地址"
          allow-clear
          style="width: 240px"
        />
        <a-select
          v-model="stateFilter"
          placeholder="全部预约状态"
          :options="stateOptions"
          allow-clear
          style="width: 160px"
        />
        <span class="toolbar-tip">共 {{ filteredVenues.length }} 家门店 · 数据来自小程序门店接口</span>
      </div>

      <a-spin :loading="loading" style="display: block">
        <a-table
          row-key="id"
          :data="filteredVenues"
          :columns="columns"
          :pagination="false"
          :scroll="{ x: 980 }"
        >
          <template #venueName="{ record }">
            <div class="venue-cell">
              <div class="venue-cover">
                <img v-if="record.venueImgPathList?.[0]?.fileUrl" :src="record.venueImgPathList[0].fileUrl" alt="">
                <icon-home v-else />
              </div>
              <div class="cell-main">{{ record.venueName }}</div>
            </div>
          </template>
          <template #venueAddress="{ record }">
            <div>{{ record.venueAddress || '—' }}</div>
            <div class="cell-sub">{{ record.distanceStr || '—' }}</div>
          </template>
          <template #venueReserveState="{ record }">
            <a-tag :color="record.venueReserveState === 0 ? 'green' : 'orange'" size="small">
              {{ record.venueReserveState === 0 ? '可预约' : '暂停预约' }}
            </a-tag>
          </template>
          <template #deviceList="{ record }">
            <a-space :size="4" wrap>
              <a-tag v-for="device in record.deviceList || []" :key="device.title" size="small">
                {{ device.title }}
              </a-tag>
              <span v-if="!record.deviceList?.length" class="cell-muted">—</span>
            </a-space>
          </template>
          <template #action="{ record }">
            <a-space>
              <a-link @click="showDetail(record)">详情</a-link>
              <a-link v-if="record.phone" :href="`tel:${record.phone}`">{{ record.phone }}</a-link>
            </a-space>
          </template>
          <template #empty>
            <a-empty description="暂无门店数据，请确认小程序 token 是否有效" />
          </template>
        </a-table>
      </a-spin>
    </a-card>

    <a-drawer v-model:visible="detailVisible" :width="width >= 680 ? 620 : '100%'" :footer="false">
      <template #title>
        <div>
          <div>{{ currentVenue?.venueName }}</div>
          <div class="drawer-sub">{{ currentVenue?.venueAddress || '门店详情' }}</div>
        </div>
      </template>

      <template v-if="currentVenue">
        <div v-if="currentVenue.venueImgPathList?.length" class="image-list">
          <img
            v-for="file in currentVenue.venueImgPathList"
            :key="file.fileKey || file.fileUrl"
            :src="file.fileUrl"
            :alt="file.fileName || currentVenue.venueName"
          >
        </div>

        <a-descriptions :column="1" size="medium" style="margin-top: 14px">
          <a-descriptions-item label="预约状态">
            <a-tag :color="currentVenue.venueReserveState === 0 ? 'green' : 'orange'" size="small">
              {{ currentVenue.venueReserveState === 0 ? '可预约' : '暂停预约' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="营业时间">{{ currentVenue.venueOpenTime || '—' }}</a-descriptions-item>
          <a-descriptions-item label="联系电话">{{ currentVenue.phone || '—' }}</a-descriptions-item>
          <a-descriptions-item label="距离">{{ currentVenue.distanceStr || '—' }}</a-descriptions-item>
          <a-descriptions-item label="停车说明">{{ currentVenue.parking || '—' }}</a-descriptions-item>
          <a-descriptions-item label="交通说明">{{ currentVenue.traffic || '—' }}</a-descriptions-item>
          <a-descriptions-item label="WiFi">
            {{ currentVenue.wifiName || '—' }}
            <span v-if="currentVenue.wifiName" class="cell-muted">（密码由门店现场提供）</span>
          </a-descriptions-item>
          <a-descriptions-item label="学习限制">
            {{ currentVenue.timeLimitFlag ? '限制单次最长学习时长' : '不限制' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider>门店设施</a-divider>
        <a-space :size="6" wrap>
          <a-tag v-for="device in currentVenue.deviceList || []" :key="device.title">{{ device.title }}</a-tag>
          <span v-if="!currentVenue.deviceList?.length" class="cell-muted">暂无设施信息</span>
        </a-space>

        <a-divider>区域介绍</a-divider>
        <a-list :data="currentVenue.roomList || []" :bordered="false">
          <template #item="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.title">
                <template #avatar>
                  <img v-if="item.imagePath" :src="item.imagePath" alt="" class="room-img">
                  <a-avatar v-else shape="square"><icon-book /></a-avatar>
                </template>
                <template #description>
                  <div class="room-tips">
                    <span v-for="tip in item.areaTipsList || []" :key="tip.content">
                      {{ tip.allowType === 0 ? '禁止' : '允许' }}：{{ tip.content }}
                    </span>
                    <span v-if="!item.areaTipsList?.length" class="cell-muted">暂无区域须知</span>
                  </div>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </template>
      <a-empty v-else description="暂无门店详情" />
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { getStudyRoomVenueIndex } from '@/apis/study'
import type { StudyRoomVenueDetailResp } from '@/apis/study/type'

defineOptions({ name: 'StudyRoomVenue' })

const { width } = useWindowSize()

const loading = ref(false)
const keyword = ref('')
const stateFilter = ref<number>()
const venueList = ref<StudyRoomVenueDetailResp[]>([])
const detailVisible = ref(false)
const currentVenue = ref<StudyRoomVenueDetailResp>()

const stateOptions = [
  { label: '可预约', value: 0 },
  { label: '暂停预约', value: 1 },
]

const filteredVenues = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return venueList.value.filter((item) => {
    const matchKeyword = !key
      || item.venueName?.toLowerCase().includes(key)
      || item.venueAddress?.toLowerCase().includes(key)
    const matchState = stateFilter.value === undefined || item.venueReserveState === stateFilter.value
    return matchKeyword && matchState
  })
})

const columns: TableInstance['columns'] = [
  { title: '门店', dataIndex: 'venueName', slotName: 'venueName', minWidth: 230 },
  { title: '地址', dataIndex: 'venueAddress', slotName: 'venueAddress', minWidth: 240 },
  { title: '营业时间', dataIndex: 'venueOpenTime', width: 120 },
  { title: '预约状态', dataIndex: 'venueReserveState', slotName: 'venueReserveState', width: 110, align: 'center' },
  { title: '设施', dataIndex: 'deviceList', slotName: 'deviceList', minWidth: 200 },
  { title: '操作', dataIndex: 'action', slotName: 'action', width: 170, align: 'center' },
]

async function load() {
  loading.value = true
  try {
    const { data } = await getStudyRoomVenueIndex()
    venueList.value = data?.venueList ?? []
  } finally {
    loading.value = false
  }
}

function showDetail(venue: StudyRoomVenueDetailResp) {
  currentVenue.value = venue
  detailVisible.value = true
}

onMounted(load)
</script>

<style scoped lang="scss">
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

.venue-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.venue-cover {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  overflow: hidden;
  flex: none;
  display: grid;
  place-items: center;
  background: var(--color-fill-2);
  color: var(--color-text-3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
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

.drawer-sub {
  margin-top: 2px;
  color: var(--color-text-3);
  font-size: 12px;
  font-weight: 400;
}

.image-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;

  img {
    width: 170px;
    height: 110px;
    object-fit: cover;
    border-radius: 8px;
    flex: none;
  }
}

.room-img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}

.room-tips {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}
</style>
