import { request } from '../../utils/util.js'

const app = getApp()

Page({
  data: {
    imgs: [],
    device: wx.getSystemInfoSync && wx.getSystemInfoSync(),
    publicPath: app.globalData.publicPath,
    canvasWidth: 375,
    canvasHeight: 750,
    qrcodeUrl: '',
    order: {},
    orderid: '',
    orderGoods: []
  },

  getRpx(num) {
    const windowWidth = this.data.device.windowWidth
    return num * (windowWidth / 750) 
  },
  onLoad (option) {
    this.setData({
      canvasWidth: this.data.device.windowWidth,
      orderid: option.orderid,
    })
  },
  _saveCanvasToImage(id) {
    const self = this;
    setTimeout(() => {
      wx.canvasToTempFilePath({
        canvasId: id,
        success (res) {
          wx.hideLoading()
          self.data.imgUrl = res.tempFilePath;
          wx.previewImage({
            urls: [res.tempFilePath] // 需要预览的图片http链接列表
          })
        }
      }, self.object);
    }, self.data.device.system.indexOf('iOS') === -1 ? 300 : 100);
  },
  drawQrcode (ctx) {
    const rpx = this.getRpx
    return new Promise(resolve => {
      wx.getImageInfo({
        src: this.data.qrcodeUrl,
        success(res) {
          ctx.drawImage(res.path, rpx(275), rpx(77), rpx(200), rpx(200))
          resolve(ctx)
        },
      })
    })
  },
  drawList (ctx) {
    return new Promise(resolve => {
      const goodsList = this.data.orderGoods
      const drawArr = goodsList.map((v, i) => this.drawItem(ctx, v, i))
      resolve(Promise.all(drawArr))
    })
  },
  drawItem (ctx, v, i) {
    return new Promise(resolve => {
      const rpx = this.getRpx
      const baseX = 95
      const baseY = 600 + 220 * i
      this.drawRoundRect(ctx, rpx(baseX), rpx(baseY), rpx(560), rpx(190), 5)
      ctx.fillStyle = '#f7f7f7'
      ctx.fill()
      // right tit
      ctx.font = 'bold 12rpx PingFang-SC-Bold'
      ctx.fillStyle = '#333'
      ctx.fillText(v.goods.title, rpx(baseX + 180), rpx(baseY + 55))
      // right num
      ctx.font = 'normal 10rpx PingFang-SC-Medium'
      ctx.fillStyle = '#999'
      ctx.fillText(`数量: ${v.num}`, rpx(baseX + 180), rpx(baseY + 95))
      // // rigfht warehouse
      ctx.font = 'normal 15rpx PingFang-SC-Medium'
      ctx.fillStyle = '#FF9800'
      ctx.fillText(`仓库: ${v.goods.warehouse.name}`, rpx(baseX + 180), rpx(baseY + 157))
      // left image
      const imageUri = v.goods.image || ''
      if (imageUri) {
        wx.getImageInfo({
          src: app.globalData.publicPath + imageUri,
          success(res) {
            ctx.drawImage(res.path, rpx(baseX + 30), rpx(baseY + 30), rpx(130), rpx(130))
            resolve(ctx)
          },
        })
      } else {
        ctx.drawImage('../../assets/zanwu.jpg', rpx(baseX + 30), rpx(baseY + 30), rpx(130), rpx(130))
        resolve(ctx)
      }
    })
  },
  drawRoundRect(cxt, x, y, width, height, radius){
    cxt.beginPath();
    cxt.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 3 / 2);
    cxt.lineTo(width - radius + x, y);
    cxt.arc(width - radius + x, radius + y, radius, Math.PI * 3 / 2, Math.PI * 2);
    cxt.lineTo(width + x, height + y - radius);
    cxt.arc(width - radius + x, height - radius + y, radius, 0, Math.PI * 1 / 2);
    cxt.lineTo(radius + x, height + y);
    cxt.arc(radius + x, height - radius + y, radius, Math.PI * 1 / 2, Math.PI);
    cxt.closePath();
  },
  onShow() {
    request({
      data: {
        orderid: this.data.orderid,
      },
      method: 'GET',
      uri: 'order/detail',
    })
      .then(res => {
        const { qrcode_file, order, order_godds } = res.data
        const cvList = order_godds.map(v => {
          const imageUrl = v.goods.image ? app.globalData.publicPath + v.goods.image : ''
          return {
            ...v,
            imageUrl,
          }
        })
        this.setData({
          qrcodeUrl: app.globalData.publicPath + qrcode_file,
          order,
          orderGoods: cvList,
          canvasHeight: order_godds.length * 220 + 700
        })
      })
  },
  drawImage() {
    wx.showLoading({
      title: '绘制中，请稍候',
    })
    const self = this
    const rpx = this.getRpx
    const windowWidth = this.data.device.windowWidth
    const ctx = wx.createCanvasContext('share')
    ctx.setFillStyle('#fff')
    ctx.fillRect(0, 0, this.data.canvasWidth, this.data.canvasHeight)
    // 核销码
    ctx.font = 'bold 15rpx PingFang-SC-Bold'
    ctx.fillStyle = '#333'
    ctx.fillText('核销码', rpx(331), rpx(40))
    // 编号
    ctx.font = '11rpx PingFang-SC-Bold'
    ctx.fillStyle = '#666'
    ctx.fillText(`订单号： ${this.data.order.orderid}`, (windowWidth - rpx(400)) / 2, rpx(310))
    // data
    ctx.font = '12rpx PingFang-SC-Bold'
    ctx.fillStyle = '#999'
    ctx.fillText(`预约日期： ${this.data.order.start_time_text}`, (windowWidth - rpx(340)) / 2, rpx(355))
    // 车牌号
    ctx.font = '12rpx PingFang-SC-Bold'
    ctx.fillStyle = '#999'
    ctx.fillText(`车牌号： ${this.data.order.plate_number}`, (windowWidth - rpx(200)) / 2, rpx(395))
    // 联系人
    ctx.font = '12rpx PingFang-SC-Bold'
    ctx.fillStyle = '#999'
    ctx.fillText(`联系人： ${this.data.order.contacts_name}-${this.data.order.contacts_tel}`, (windowWidth - rpx(340)) / 2, rpx(435))
    // rectmu
    ctx.setFillStyle('#f9f9f9')
    ctx.fillRect(0, rpx(460), windowWidth, rpx(20))
    // 商品清单
    ctx.font = 'bold 15rpx PingFang-SC-Bold'
    ctx.fillStyle = '#333'
    ctx.fillText('商品清单', rpx(316), rpx(540))
    // line left
    ctx.setFillStyle = '#666'
    ctx.fillRect(rpx(207), rpx(530), rpx(80), rpx(2))
    // line right
    ctx.setFillStyle = '#666'
    ctx.fillRect(rpx(470), rpx(530), rpx(80), rpx(2))
    ctx.draw()
    // list
    this.drawQrcode(ctx)
      .then(ctx => this.drawList(ctx))
      .then(ctx => {
        ctx[ctx.length - 1].draw(
          true,
          this._saveCanvasToImage('share')
        )
      })
  },
})