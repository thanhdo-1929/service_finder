import React, { memo } from "react";
import { text } from "../ultils/constants";
import { Button } from "../components";
import { SiZalo } from "react-icons/si";

const Contact = () => {
  return (
    <div className="bg-white w-main rounded-md shadow-md p-4 flex flex-col justify-center items-center gap-6">
      <img
        src={text.image}
        alt="thumbnal"
        className="w-full h-48 object-contain"
      />
      <p>{text.content}</p>
      <div className="flex items-center justify-around w-full">
        {text.contacts.map((item, index) => {
          return (
            <div
              key={index}
              className="flex flex-col items-center justify-center"
            >
              <span className="text-orange-500 font-semibold">{item.text}</span>
              <span className="text-blue-900 text-[24px] font-semibold">
                {item.phone}
              </span>
              {/* <span className='text-blue-900 text-[24px] font-semibold'>{item.zalo}</span> */}
              <span className="font-medium text-[20px]">
                <a
                  className="text-blue-500  hover:underline"
                  href={item.zalo}
                  target="_blank"
                >
                  <SiZalo className="h-10 w-10" />
                </a>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(Contact);
