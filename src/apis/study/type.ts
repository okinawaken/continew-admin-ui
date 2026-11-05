/** 自动预约任务查询条件 */
export interface StudyRoomAutoReserveTaskQuery extends PageQuery {
  venueId?: number
  enableStatus?: number
  sort?: string[]
}

/** 自动预约任务创建 / 修改请求 */
export interface StudyRoomAutoReserveTaskReq {
  venueId?: number
  seatId?: number
  seatNumber?: string
  areaId?: number
  areaName?: string
  reserveStartTime?: string
  reserveEndTime?: string
  weekDays?: number[]
}

/** 自动预约任务 */
export interface StudyRoomAutoReserveTaskResp {
  id: number
  userId?: number
  tenantId?: number
  venueId: number
  venueName?: string
  seatId?: number
  seatNumber?: string
  areaId?: number
  areaName?: string
  reserveStartTime?: string
  reserveEndTime?: string
  weekDays?: number[]
  enableStatus: number
  pauseReason?: string
  lastMaxReserveDate?: string
  createTime?: string
}

/** 自动预约执行记录查询条件 */
export interface StudyRoomAutoReserveTaskRecordQuery extends PageQuery {
  taskId?: number
  userId?: number
  triggerType?: number
  targetDate?: string
  status?: number
  sort?: string[]
}

/** 自动预约执行记录 */
export interface StudyRoomAutoReserveTaskRecordResp {
  id: number
  taskId: number
  userId?: number
  tenantId?: number
  triggerType: number
  targetDate: string
  status: number
  seatId?: number
  seatNumber?: string
  timeRange?: string
  userReserveId?: number
  failMsg?: string
  createTime?: string
}

/** 自习室用户配置 */
export interface StudyRoomUserConfig {
  releaseTime?: string
  signInEnable?: number
  token?: string
}

/** 用户配置响应 */
export interface StudyRoomUserSettingResp {
  tenantId?: number
  userId?: number
  config?: StudyRoomUserConfig
}

/** 用户配置写请求（全量更新，未提交的配置项会被清空） */
export interface StudyRoomUserSettingReq {
  releaseTime?: string
  signInEnable?: number
  token?: string
}

/** 门店简要信息 */
export interface StudyRoomVenueSimpleResp {
  id: number
  venueName: string
  meituanShopCode?: string
  meituanShopName?: string
  openShopUuid?: string
}

export interface StudyRoomVenueSelectResp {
  venueList: StudyRoomVenueSimpleResp[]
}

/** 区域 */
export interface StudyRoomAreaResp {
  id: number
  areaName: string
}

export interface StudyRoomAreaSelectResp {
  areaList: StudyRoomAreaResp[]
}

/** 座位 */
export interface StudyRoomSeatResp {
  id: number
  seatNumber: string
  venueId?: number
  lightBindStatus?: number
  seatReserveState?: number
  seatReserveDesc?: string
  seatReserveDescReal?: string
  seatReserveChannel?: number
  seatReserveChannelReal?: number
  minStartTimeStr?: string
  minReserveDesc?: string
  nextReserveDesc?: string
  reserveRecordList?: StudyRoomSeatReserveRecordResp[]
  validTimeStrList?: StudyRoomSeatValidTimeResp[]
}

/** 座位区域 */
export interface StudyRoomSeatAreaResp {
  id: number
  areaName: string
  hasAreaPackage?: number
  venueAreaSeatList: StudyRoomSeatResp[]
}

export interface StudyRoomSeatMapResp {
  reserveHoldMinutes?: string
  reserveCancelLimit?: string
  reserveCancelMinutes?: string
  venue?: StudyRoomVenueDetailResp
  venueAreaList: StudyRoomSeatAreaResp[]
}

/** 座位查询请求 */
export interface StudyRoomSeatQueryReq {
  venueId: number
  reserveDateStr: string
  reserveStartTimeStr?: string
  reserveEndTimeStr?: string
  reserveAnotherFlag?: number
}

/* ========================= P1 / P2 接口类型 ========================= */

/** 图片信息 */
export interface StudyRoomFileResp {
  fileKey?: string
  fileName?: string
  fileUrl?: string
  linkHtmlType?: number
  linkHtmlUrl?: string
}

/** 时间点 */
export interface StudyRoomTimePointResp {
  hour?: number
  minute?: number
}

/** 门店设施 */
export interface StudyRoomVenueDeviceResp {
  icon?: string
  title?: string
}

/** 区域提示 */
export interface StudyRoomAreaTipResp {
  allowType?: number
  content?: string
}

/** 门店区域介绍 */
export interface StudyRoomVenueRoomResp {
  title?: string
  imagePath?: string
  areaTipsList?: StudyRoomAreaTipResp[]
}

/** 门店详情 */
export interface StudyRoomVenueDetailResp {
  id: number
  venueName: string
  venueAddress?: string
  venueLat?: number
  venueLng?: number
  venueOpenTime?: string
  venueReserveState?: number
  distanceStr?: string
  backImage?: string
  parking?: string
  phone?: string
  traffic?: string
  venueGuideUrl?: string
  timeLimitFlag?: boolean
  minTime?: StudyRoomTimePointResp
  maxTime?: StudyRoomTimePointResp
  venueImgPathList?: StudyRoomFileResp[]
  deviceList?: StudyRoomVenueDeviceResp[]
  roomList?: StudyRoomVenueRoomResp[]
  wifiName?: string
  wifiPwd?: string
}

/** 座位可约时段 */
export interface StudyRoomSeatValidTimeResp {
  validStartTimeStr?: string
  validEndTimeStr?: string
  validMinuteStr?: string
  validTimeStr?: string
}

/** 座位预约占用 */
export interface StudyRoomSeatReserveRecordResp {
  id?: number
  reserveDateStr?: string
  reserveMinuteStr?: string
  reserveTimeStr?: string
}

/** 可预约日期 */
export interface StudyRoomReserveDateResp {
  reserveDateList: string[]
}

/** 预约首页 */
export interface StudyRoomReserveIndexResp {
  areaIdBtn?: string
  channelBiliBtn?: string
  bannerImgList?: StudyRoomFileResp[]
  backImgList?: StudyRoomFileResp[]
  venueNameBtn?: string
  venueList?: StudyRoomVenueDetailResp[]
}

/** 预约资格校验 */
export interface StudyRoomUserPackageResp {
  id: number
  signInUserPackageId?: number
  packageId?: number
  packageName?: string
  packageType?: number
  restNum?: number
  useNum?: number
  leaveRealNum?: number
  leaveTotalNum?: number
  useExpiryDate?: number
  useExpiryDateStr?: string
  venueId?: number
  orderNumber?: string
  orderId?: number
  remark?: string
}

export interface StudyRoomReserveCheckResp {
  canReservePackageList?: StudyRoomUserPackageResp[]
  reserveState?: number
  reserveStateMsg?: string
}

export interface StudyRoomReserveAnotherCheckResp {
  canReserveAnother?: number
  hasReserveAnotherPackage?: number
  descNoReserveAnother?: string
}

export interface StudyRoomSignAnotherCheckResp {
  canSignAnother?: number
  hasSignAnotherPackage?: number
  descNoSignAnother?: string
  settlePackageList?: StudyRoomSettlePackageResp[]
}

/** 我的预约 */
export interface StudyRoomUserReserveResp {
  id: number
  venueId?: number
  venueName?: string
  areaName?: string
  seatNumber?: string
  reserveDateStr?: string
  reserveTimeStr?: string
  reserveWeekStr?: string
  reserveStatusDesc?: string
  canCancel?: number
  canReserveAnother?: number
  descNoReserveAnother?: string
  subscribeFlag?: number
}

export interface StudyRoomUserReserveListResp {
  list: StudyRoomUserReserveResp[]
}

export interface StudyRoomUserReserveCancelTipResp {
  tipDesc?: string
  userReserveId?: number
}

export interface StudyRoomUserReserveCancelReq {
  userReserveId: number
}

/** 签到信息 */
export interface StudyRoomUserSignSeatInfoResp {
  areaName?: string
  seatNumber?: string
  signInTimeStr?: string
  studyHours?: number
  studyMinutes?: number
}

export interface StudyRoomUserSignResp {
  id?: number
  signSerialNo?: number
  signDateStr?: string
  venue?: StudyRoomVenueSimpleResp
  venueId?: number
  signInTimeStr?: string
  signOutExpectTimeStr?: string
  signOutTimeStr?: string
  packageName?: string
  restTimeStr?: string
  settleHourStr?: string
  areaDesc?: string
  hasPayed?: number
  packageNamePayed?: string
  venueAreaSeat?: {
    areaName?: string
    seatNumber?: string
  }
  studyMinuteStr?: string
  seatInfo?: StudyRoomUserSignSeatInfoResp
}

export interface StudyRoomUserSignListResp {
  list: StudyRoomUserSignResp[]
}

/** 签到首页 */
export interface StudyRoomIndexResp {
  hasVenue?: number
  hasSeat?: number
  hasUserPackage?: number
  canChangeSeat?: number
  canSignAnother?: number
  userSignId?: number
  userSign?: StudyRoomUserSignResp
  userSignInfoList?: StudyRoomUserSignResp[]
  userSignInfoNum?: number
  userReserveInfoNum?: number
  studyDays?: number
  signInUserPackage?: StudyRoomUserPackageResp
  seatCurrent?: StudyRoomSeatResp
  venueNearest?: StudyRoomVenueDetailResp
  venueNearestList?: StudyRoomVenueDetailResp[]
  nextReserveInfo?: {
    reserveDesc?: string
    reserveDateStr?: string
    reserveTimeStr?: string
  }
  studyBackImg?: string
  buttonTextOfSignIn?: string
  buttonTextOfSignOut?: string
  buttonTextOfChangeSeat?: string
  buttonTextOfSelectPackage?: string
  buttonTextOfLight?: string
  buttonTextOfGuard?: string
  buttonTextOfCabinet?: string
  configStudyIndexText?: string
  configStudyNoVenueText?: string
  descNoSignIn?: string
  descNoSignOut?: string
  descNoPackageSelect?: string
  descNoChangeSeat?: string
  descNoSignAnother?: string
  qrCodeNeedSignIn?: string
  qrCodeNeedSignOut?: string
  showMaxStudyTimeFlag?: boolean
  signAnotherBtn?: string
  wifiConnBtn?: string
  cabinetOnline?: string
  guardOnline?: string
  lightOnline?: string
}

/** 签到 / 换座 / 签退结算 */
export interface StudyRoomSignSeatMapResp extends StudyRoomSeatMapResp {
  userSignId?: number
  signInUserPackage?: StudyRoomUserPackageResp
  signAnotherFlag?: number
}

export interface StudyRoomSignSeatListResp extends StudyRoomSignSeatMapResp {
  signInFlag?: number
}

export interface StudyRoomSettleDataResp {
  settleTimeStr?: string
  studyTimeDesc?: string
  studyMinuteDesc?: string
  usedTimeStr?: string
}

export interface StudyRoomSettlePackageResp {
  id: number
  packageId?: number
  packageName?: string
  settleHourStr?: string
  restNum?: number
  restTimeStr?: string
  packageType?: number
  packageTypeStr?: string
  areaDesc?: string
  autoSelected?: number
  canUsePay?: number
  canNotUse?: number
  buyTimeStr?: string
  canNotUsePayDesc?: string
  leaveType?: number
  maxStudyTimeStr?: string
  signOutExpectTimeStr?: string
  useExpiryDateStr?: string
  usedType?: number
}

export interface StudyRoomSettlementResp {
  signOutType?: number
  userPackageId?: number
  venueName?: string
  venueAddress?: string
  studyTipText?: string
  needBuyPackage?: number
  settleData?: StudyRoomSettleDataResp
  userPackageList?: StudyRoomSettlePackageResp[]
}

export interface StudyRoomUserPackageConfirmResp {
  unpaidMinute?: number
  userPackageId?: number
  signOutType?: number
  studyTipText?: string
  settleData?: StudyRoomSettleDataResp
}

export interface StudyRoomSignOutResp {
  userSignId?: number
  packageName?: string
  settleHourStr?: string
  signOutExpectTimeStr?: string
  studyHours?: number
  studyMinutes?: number
  payPriceYuan?: number
  signOutTimeStr?: string
  studyTipText?: string
}

export interface StudyRoomSeatConfirmResp {
  studyTipText?: string
}

export interface StudyRoomChangeSeatConfirmResp {
  studyTipText?: string
}

export interface StudyRoomSignSeatQueryReq {
  qrCode: string
  venueId?: number
  signInUserPackageId?: number
  signAnotherFlag?: number
}

export interface StudyRoomSeatConfirmReq {
  seatId: number
  currentLng?: number
  currentLat?: number
  signInUserPackageId: number
  signAnotherFlag?: number
}

export interface StudyRoomChangeSeatReq {
  userSignId: number
}

export interface StudyRoomChangeSeatConfirmReq {
  seatId: number
  currentLng?: number
  currentLat?: number
  userSignId: number
}

export interface StudyRoomSettlementReq {
  userSignId: number
}

export interface StudyRoomUserPackageConfirmReq {
  userSignId: number
  userPackageId: number
}

export interface StudyRoomSignOutReq {
  qrCode: string
  currentLng?: number
  currentLat?: number
  settleUserPackageId: number
  userSignId: number
}

export interface StudyRoomEspLightTurnReq {
  seatId: number
  turnFlag: 'turnOn' | 'turnOff'
}

/** 门禁 */
export interface StudyRoomGuardResp {
  id: number
  areaAliasName?: string
  canOpen?: number
  canNotOpenDesc?: string
  configJsonTwo?: string
}

export interface StudyRoomGuardListResp {
  guardList: StudyRoomGuardResp[]
}

export interface StudyRoomGuardOpenReq {
  guardId: number
}

/** 学习排行 */
export interface StudyRoomRankUserResp {
  rankNum?: number
  userId?: number
  nickName?: string
  headImg?: string
  studyTotalTimeStr?: string
  studyDays?: number
}

export interface StudyRoomRankResp {
  rankUserList?: StudyRoomRankUserResp[]
}

/** 套餐 v2 */
export interface StudyRoomBuyV2PackageListReq {
  venueId?: number
  packageType?: number
  packageLabelIds?: number[]
  seatAreaId?: number
}

export interface StudyRoomIdNameResp {
  id: number
  name: string
}

export interface StudyRoomPackageItemResp {
  id: number
  packageName: string
  packageType?: number
  packageTypeStr?: string
  packageDesc?: string
  packageImgPath?: string
  originalPriceYuan?: number
  packageAccountPriceYuan?: number
  specialTag?: string
}

export interface StudyRoomBuyV2PackageListResp {
  packageList: StudyRoomPackageItemResp[]
}

export interface StudyRoomPackageAreaResp {
  id: number
  areaName?: string
  areaDesc?: string
  priceHourYuan?: number
  priceDayYuan?: number
  priceMonthYuan?: number
}

export interface StudyRoomPackageVenueResp {
  id: number
  venueName?: string
  venueAddress?: string
  distance?: number
  venueAreaList?: StudyRoomPackageAreaResp[]
}

export interface StudyRoomBuyV2PackageDetailResp {
  id: number
  packageName: string
  packageType?: number
  packageTypeStr?: string
  packageTypeDesc?: string
  packageDesc?: string
  packageImgPath?: string
  originalPriceYuan?: number
  packageAccountPriceYuan?: number
  consumeUseNumDesc?: string
  validTimeDesc?: string
  settleHourDesc?: string
  useAreasDesc?: string
  buyPerNumDesc?: string
  maxPerBuyNum?: number
  descPageContent?: string
  descPageUrl?: string
  failureDateDesc?: string
  failureWeekdayDesc?: string
  failureHolidayDesc?: string
  venueList?: StudyRoomPackageVenueResp[]
}

export interface StudyRoomBuyV2PackageLabelResp {
  packageLabelList?: StudyRoomIdNameResp[]
  seatAreaList?: StudyRoomIdNameResp[]
}

export interface StudyRoomBuyV2PackageOptResp {
  packageBuyHtml?: string
  packageBuyImg?: string
  packagePayBtn?: string
  packageTypeList?: StudyRoomIdNameResp[]
  packageLabelList?: StudyRoomIdNameResp[]
  packageLabelListOfType2?: StudyRoomIdNameResp[]
  venueList?: StudyRoomIdNameResp[]
}

/** 订单 */
export interface StudyRoomUserOrderResp {
  id: number
  orderNumber?: string
  packageName?: string
  packageType?: number
  packagePriceTotal?: number
  payPrice?: number
  payRealMoney?: number
  discountPrice?: number
  payState?: number
  payStateStr?: string
  payTypeStr?: string
  payNumber?: string
  buyTimeStr?: string
  payTimeStr?: string
  createTimeStr?: string
}

export interface StudyRoomUserOrderListResp {
  list: StudyRoomUserOrderResp[]
}

export interface StudyRoomWxPayQueryResp {
  id?: number
  status?: number
  tradeState?: string
  outTradeNo?: string
  transactionId?: string
  totalFee?: number
  orderId?: number
  openid?: string
  body?: string
  attach?: string
}

/** 报修 */
export interface StudyRoomRepairResp {
  id: number
  venueName?: string
  repairDesc?: string
  repairImgList?: string[]
  handleState?: number
  handleRemark?: string
  createTimeStr?: string
  handleTimeStr?: string
}

export interface StudyRoomRepairListResp {
  list: StudyRoomRepairResp[]
}

export interface StudyRoomRepairSubmitReq {
  venueId: number
  repairDesc: string
  repairImgList?: string[]
}

/** 储物柜 */
export interface StudyRoomCabinetVenueResp {
  cabinetId: number
  cabinetName?: string
  venueId?: number
  saleCount?: number
}

export interface StudyRoomCabinetVenueListResp {
  list: StudyRoomCabinetVenueResp[]
}

export interface StudyRoomCabinetGridResp {
  gridId: number
  gridCode?: string
  gridStatus?: number
}

export interface StudyRoomCabinetGridListResp {
  list: StudyRoomCabinetGridResp[]
}

export interface StudyRoomCabinetGridPriceResp {
  gridId?: number
  gridCode?: string
  startDate?: string
  endDate?: string
  price?: number
  leaseType?: number
}

export interface StudyRoomCabinetUserGridResp {
  gripId: number
  gripCode?: string
  cabinetName?: string
  allowOpen?: number
  checkoutStatus?: number
  lastLeaseId?: number
  leaseEndTime?: string
}

export interface StudyRoomCabinetUserGridListResp {
  list: StudyRoomCabinetUserGridResp[]
}

export interface StudyRoomCabinetLeaseOrderResp {
  id: number
  leaseId?: number
  venueName?: string
  cabinetNo?: string
  startDateStr?: string
  endDateStr?: string
  priceYuan?: number
  payState?: number
  payStateStr?: string
  createTimeStr?: string
}

export interface StudyRoomCabinetLeaseOrderListResp {
  list: StudyRoomCabinetLeaseOrderResp[]
}

export interface StudyRoomCabinetWifiOpenReq {
  gripId: number
}
