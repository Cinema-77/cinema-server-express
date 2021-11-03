import cc from "coupon-code";

import Payment from "../models/Payment";
import MovieBillDetail from "../models/MovieBillDetail";
import FoodDetail from "../models/FoodDetail";
import FoodBill from "../models/FoodBill";
import MovieBill from "../models/MovieBill";
import Coupon from "../models/Coupon";
import Gift from "../models/Gift";
import GiftDetail from "../models/GiftDetail";
import User from "../models/User";

export const isPayment = async (username, password, total) => {
  const payment = await Payment.findOne({ username, password });
  if (payment) {
    if (total && payment.money >= total) {
      payment.money -= total;
      await payment.save();
      return {
        message: "Thanh toán thành công.",
        success: true,
      };
    } else if (payment.money < total) {
      return {
        message:
          "Tài khoảng của quý khách không đủ ${total}, để thanh toán vui lòng nạp thêm tiền vào tài khoản.",
        success: false,
      };
    } else {
      return { message: "Tài khoản thanh toán không hợp lệ.", success: false };
    }
  }
  return { message: "Tài khoản thanh toán không hợp lệ.", success: false };
};

const getItemMovieBill = (values) => {
  let res = [];
  values.forEach((item) => {
    res = [...res, item.ticket];
  });
  return res;
};

export const mergeMovieBill = async (values) => {
  let res = [];
  for (let i = 0; i < values.length; i++) {
    const billDetail = await MovieBillDetail.find({
      movieBill: values[i]._id,
    }).populate("ticket");

    if (!res.some((x) => x.bill._id === values[i]._id)) {
      res.push({
        bill: values[i],
        type: 0,
        data: getItemMovieBill(await billDetail),
      });
    } else {
      const index = res.findIndex((x) => x.bill._id === values[i]._id);
      res[index] = {
        ...res[index],
        data: res[index].data.concat(getItemMovieBill(await billDetail)),
      };
    }
  }

  return res;
};

const getItemFoodBill = (values) => {
  let res = [];
  values.forEach((item) => {
    res = [...res, item.food];
  });
  return res;
};

export const mergeFoodBill = async (values) => {
  let res = [];
  for (let i = 0; i < values.length; i++) {
    const billDetail = await FoodDetail.find({
      foodBill: values[i]._id,
    }).populate("food");

    if (!res.some((x) => x.bill._id === values[i]._id)) {
      res.push({
        bill: values[i],
        type: 1,
        data: getItemFoodBill(await billDetail),
      });
    } else {
      const index = res.findIndex((x) => x.bill._id === values[i]._id);
      res[index] = {
        ...res[index],
        data: res[index].data.concat(getItemFoodBill(await billDetail)),
      };
    }
  }

  return res;
};

export const renderBill = async (idTicketBill, idFoodBill) => {
  let res = {
    date: new Date().toISOString(),
  };
  if (idTicketBill) {
    const tkBill = await MovieBill.findById(idTicketBill);
    const tkBillDetail = await MovieBillDetail.find({
      movieBill: idTicketBill,
    }).populate("ticket");
    res.ticketBill = {
      bill: tkBill,
      data: getItemMovieBill(tkBillDetail),
    };
  }
  if (idFoodBill) {
    const foodBill = await FoodBill.findById(idFoodBill);
    const foodBillDetail = await FoodDetail.find({
      foodBill: idFoodBill,
    }).populate("food");
    res.foodBill = {
      bill: foodBill,
      data: getItemFoodBill(foodBillDetail),
    };
  }

  return res;
};

export const createCoupon = async (userId, giftId) => {
  const user = await User.findById(userId);
  const gift = await Gift.findById(giftId);
  // đính điểm cho data
  let point = gift.point;
  if (user.point < point) {
    return {
      success: false,
      message:
        "Bạn không đủ điểm để đổi coupon này, vui lòng chọn quà khác hoặc tính điểm thêm.",
    };
  }
  if (!gift) {
    return {
      success: false,
      message: "Không tìm thấy quà tặng này, vui lòng lại sau.",
    };
  }
  // add coupon
  const dateNow = new Date().toISOString();
  const coupon = new Coupon({
    code: cc.generate(),
    createAt: dateNow,
    pointTotal: point,
    dateExpiry: new Date(dateNow).setDate(new Date(dateNow).getDate() + 7),
    user: user._id,
    gift: gift._id,
    status: 0,
  });
  await coupon.save();

  // trừ điểm
  user.point -= point;
  user.save();
  return {
    success: true,
    message: "Đổi coupon thành công.",
    values: {
      coupon: await Coupon.findById(coupon._id).populate("gift"),
    },
  };
};

export const getCoupon = async (code, userId) => {
  const coupon = await Coupon.findOne({ code, user: userId }).populate("gift");
  return {
    success: coupon ? true : false,
    coupon,
  };
};
