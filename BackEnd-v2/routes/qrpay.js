import express from 'express';
const qrpayRouter = express.Router();
const qrpayCallbackRouter = express.Router();
export {qrpayRouter, qrpayCallbackRouter};

import moment from 'moment';
import paymentFollowupWork from './commission';
import alipay from '../util/alipay';

const {
  QRPay,
  TemplatePlan: TP,
  UserBilling: UB,
  UserPaymentLog: UPL,
  UserPaymentMethod: UPM,
  User
} = models;

qrpayRouter.post('/api/qrpay/create', async (req, res, next) => {
  let {id: userId} = req.user;
  let {planId, month = 1} = req.body;
  month = parseInt(month)
  let template_plan = await TP.findById(planId);
  if (!template_plan) throw new Error('Not Found');

  let tradeNo = `${new Date().getTime()}_${userId}`;
  let amount = parseFloat((template_plan.onSalePrice * month * 6.9).toFixed(2));

  let createReq = {
    tradeNo,
    subject: `Newbidder ${template_plan.name} Plan`,
    totalAmount: amount,
    body: `${template_plan.name} Plan`,
    timeExpress: 5
  }

  let createResp;

  try {
    createResp = await alipay.createQRPay(createReq);
    let qrpay = await QRPay.create({
      userId,
      channel: 0,
      tradeNumber: tradeNo,
      goodsType: 1,
      goodsId: planId,
      goodsVolume: month,
      amount: amount,
      status: 0,
      createdAt: moment().unix(),
      createReq: JSON.stringify(createReq),
      createResp: JSON.stringify(createResp),
      callbackAt: 0,
      callback: ''
    })
    res.json({
      status: 1,
      data: {
        id: qrpay.id,
        url: createResp.qr_code,
        amount
      }
    });
  } catch (e) {
    next(e);
  }

})

qrpayRouter.post('/api/qrpay/status', async (req, res, next) => {
  let {id} = req.body;
  let qrpay = await QRPay.findById(id);
  res.json({
    status: 1,
    data: {
      status: qrpay.status === 3
    }
  })
})

qrpayCallbackRouter.post('/alipay/callback', async (req, res, next) => {
  res.send("success")
  try {
    console.log(moment(), req.body)
    var signStatus = alipay.verifyCallback(req.body);
    if(signStatus === false) {
      throw new Error("回调签名验证未通过");
    }

    var tradeNo = req.body["out_trade_no"];
    var tradeStatus = req.body["trade_status"];

    let upl;
    await UB.sequelize.transaction(async (transaction) => {

      let qrpay = await QRPay.findOne({where: {
        tradeNumber: tradeNo
      }})

      if (!qrpay) {
        return
      }

      if (qrpay.status === 3) {
        return
      }

      if(tradeStatus !== "TRADE_SUCCESS") {
        return
      }

      qrpay.status = 3;
      qrpay.callback = JSON.stringify(req.body)
      qrpay.callbackAt = moment().unix()
      qrpay.save({transaction});

      let template_plan = await TP.findById(qrpay.goodsId);

      let user = await User.findById(qrpay.userId);
      user.status = 1;
      await user.save({ transaction })

      let old_ub = await UB.findOne({
        where: {
          userId: qrpay.userId,
          expired: 0
        }
      })

      if (old_ub) {
        old_ub.expired = 1;
        await old_ub.save({transaction})
      }

      let upm = await UPM.create({
        userId: qrpay.userId,
        type: 3,
        paypalAgreementId: 0,
        info: `pay with alipay ${qrpay.tradeNumber}`,
        changedAt: moment().unix()
      }, {transaction})

      upl = await UPL.create({
        userId: qrpay.userId,
        paymentMethod: upm.id,
        amount: parseInt(qrpay.amount / 6.9),
        tax: 0,
        goodsType: qrpay.goodsType,
        goodsId: qrpay.goodsId,
        goodsVolume: qrpay.goodsVolume,
        timeStamp: moment().unix()
      }, {transaction})

      let events_offset = 0;
      if (old_ub) events_offset = old_ub.netEvents()

      let ub = await UB.create({
        userId: qrpay.userId,
        agreementId: 0,
        planId: qrpay.goodsId,
        planPaymentLogId: upl.id,
        billedEvents: 0,
        totalEvents: 0,
        freeEvents: 0,
        overageEvents: 0,
        planStart: moment().startOf('day').unix(),
        planEnd: moment().add(qrpay.goodsVolume, 'month').add(1, 'day').startOf('day').unix(),
        includedEvents: template_plan.eventsLimit + events_offset,
        nextPlanId: 0,
        nextPaymentMethod: 0,
        expired: 0
      }, transaction)
    })
    if (upl && upl.id) {
      await paymentFollowupWork(upl.id);
    }
  } catch (e) {
    console.log(e);
  }

});
