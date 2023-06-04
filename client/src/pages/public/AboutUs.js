import React from "react";
import { Contact, Intro } from "../../components";
const AboutUs = () => {
  return (
    <div className="bg-white rounded-md p-4 flex flex-col items-center w-full gap-3">
      <h2 className="text-[28px] font-bold">Liên hệ</h2>
      <div className="bg-blue-100 border-blue-200 border rounded-md p-4 text-sm text-blue-800 mt-4">
        <span>Chúng tôi cung cấp các dịch vụ sau đây:</span>
        <ul className="list-disc pl-8">
          <li>Người chủ trọ đăng tin tìm kiếm người thuê</li>
          <li>
            Người chủ quán ăn hoặc các dịch vụ khác cần quản bá của hàng cửa
            mình thông quan các bài đăng
          </li>
          <li>
            Người có nhu cầu thuê trọ dễ dàng tìm được các phòng trọ phù hợp
          </li>
          <li>
            Người có nhu cầu dễ dàng tìm kiếm các quán ăn gần đây ngon, bổ, rẻ
          </li>
          <li>
            Người có nhu cầu dễ dàng tìm kiếm các dịch vụ khác phù hợp với nhu
            cầu cá nhân
          </li>
        </ul>
      </div>
      <Contact />

      <Intro />
    </div>
  );
};

export default AboutUs;
