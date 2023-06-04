import React, { useEffect, useState } from "react";
import { Pagination, Search } from "../../components";
import {
  apiGetUsers,
  apiGetRoles,
  apiUpdateUserByAdmin,
  apiDeleteUser,
} from "../../apis";
import moment from "moment";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { validate } from "../../ultils/fn";
import Swal from "sweetalert2";
import { useDebounce } from "../../hooks/useDebounce";

const ManageUser = () => {
  const [users, setUsers] = useState(null);
  const [edit, setEdit] = useState(null);
  const [update, setUpdate] = useState(false);
  const [searchParams] = useSearchParams();
  const [roles, setRoles] = useState(null);
  const [invalidFields, setInvalidFields] = useState([]);
  const [payload, setPayload] = useState({
    email: "",
    role: "",
    name: "",
  });
  const [q, setQ] = useState("");
  const query = useDebounce(q, 500);
  const fetchUsers = async (params) => {
    const response = await apiGetUsers({
      ...params,
      limit: process.env.REACT_APP_LIMIT_ADMIN,
    });
    if (response.success) setUsers(response?.users);
  };
  const fetchRoles = async () => {
    const response = await apiGetRoles();
    if (response.success) setRoles(response?.roles);
  };
  const handleUpdate = (user) => {
    setEdit(user);
    setPayload({
      email: user?.email,
      role: user?.role,
      name: user?.name,
    });
  };
  useEffect(() => {
    fetchRoles();
  }, []);
  useEffect(() => {
    let params = [];
    for (let entry of searchParams.entries()) params.push(entry);
    let searchParamsObject = {};
    params?.forEach((i) => {
      if (Object.keys(searchParamsObject)?.some((item) => item === i[0])) {
        searchParamsObject[i[0]] = [...searchParamsObject[i[0]], i[1]];
      } else {
        searchParamsObject = { ...searchParamsObject, [i[0]]: [i[1]] };
      }
    });
    if (q) searchParamsObject.q = q;
    if (!edit) fetchUsers(searchParamsObject);
  }, [edit, update, searchParams, query]);

  const deletePost = async (uid) => {
    const response = await apiDeleteUser(uid);
    if (response.success) {
      toast.success(response.mes);
      setUpdate(!update);
    } else toast.error(response.mes);
  };
  const handleSubmit = async () => {
    const invalids = validate(
      { email: payload.email, name: payload.name },
      setInvalidFields
    );
    if (invalids === 0) {
      const response = await apiUpdateUserByAdmin(edit.id, payload);
      if (response.success) setEdit(null);
      else toast.error(response.user);
    }
  };
  return (
    <div className="relative h-full bg-white p-4">
      <div className="flex items-center justify-between gap-8 border-b">
        <h3 className="font-bold text-[30px] pb-4 ">Quản lý thành viên</h3>
        {edit?.id && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="py-2 px-4 bg-blue-600 rounded-md text-white font-semibold flex items-center justify-center gap-2"
            >
              <span>Update</span>
            </button>
            <button
              type="button"
              onClick={() => setEdit(null)}
              className="py-2 px-4 bg-orange-600 rounded-md text-white font-semibold flex items-center justify-center gap-2"
            >
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 w-full flex items-center justify-end gap-4">
        <input
          type="text"
          className="p-2 border rounded-md w-[500px] outline-none"
          placeholder="Tìm theo tên hoặc email...."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="py-4">
        <table className="table-auto w-full mt-4 border-2 border-gray-400">
          <thead>
            <tr className="border-b border-t border-2 border-gray-400">
              <td className="p-2 font-bold border-2 border-gray-400">STT</td>
              <td className="p-2 font-bold border-2 border-gray-400">
                Tên thành viên
              </td>
              <td className="p-2 font-bold border-2 border-gray-400">Email</td>
              <td className="p-2 font-bold border-2 border-gray-400">
                Vai trò
              </td>
              <td className="p-2 font-bold border-2 border-gray-400">
                Số bài đăng
              </td>
              <td className="p-2 font-bold border-2 border-gray-400">
                Ngày tạo
              </td>
              <td className="p-2 font-bold border-2 border-gray-400">
                Hành động
              </td>
            </tr>
          </thead>
          <tbody>
            {users?.rows?.map((item, index) => (
              <tr key={item.id}>
                <td
                  className={`p-2 border-2 border-gray-400 ${
                    index % 2 === 0 ? "" : "bg-gray-100"
                  } m-auto`}
                >
                  {!+searchParams.get("page")
                    ? index + 1
                    : index +
                      1 +
                      (+searchParams.get("page") - 1) *
                        +process.env.REACT_APP_LIMIT_ADMIN}
                </td>
                <td
                  className={`p-2 border-2 border-gray-400 ${
                    index % 2 === 0 ? "" : "bg-gray-100"
                  } m-auto`}
                >
                  {edit?.id === item.id ? (
                    <input
                      type="text"
                      value={payload.name}
                      onChange={(e) =>
                        setPayload((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="py-2 px-4 border rounded-md"
                      onFocus={() => setInvalidFields && setInvalidFields([])}
                    />
                  ) : (
                    <span>{item?.name}</span>
                  )}
                  {edit?.id === item.id &&
                    invalidFields?.some((i) => i.name === "name") && (
                      <div className="text-red-500 text-xs italic">
                        {invalidFields.find((i) => i.name === "name")?.message}
                      </div>
                    )}
                </td>
                <td
                  className={`p-2 border-2 border-gray-400 ${
                    index % 2 === 0 ? "" : "bg-gray-100"
                  } m-auto`}
                >
                  {edit?.id === item.id ? (
                    <input
                      type="text"
                      value={payload.email}
                      onChange={(e) =>
                        setPayload((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="py-2 px-4 border rounded-md"
                      onFocus={() => setInvalidFields && setInvalidFields([])}
                    />
                  ) : (
                    <span>{item?.email}</span>
                  )}
                  {edit?.id === item.id &&
                    invalidFields?.some((i) => i.name === "email") && (
                      <div className="text-red-500 text-xs italic">
                        {invalidFields.find((i) => i.name === "email")?.message}
                      </div>
                    )}
                </td>
                <td
                  className={`p-2 border-2 border-gray-400 ${
                    index % 2 === 0 ? "" : "bg-gray-100"
                  } m-auto`}
                >
                  {edit?.id === item.id ? (
                    <select
                      className="border px-4 py-2 rounded-md"
                      value={payload.role}
                      onChange={(e) =>
                        setPayload((prev) => ({
                          ...prev,
                          role: e.target.value,
                        }))
                      }
                    >
                      {roles?.map((el) => (
                        <option key={el.code} value={el.code}>
                          {el.value}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{item?.roleData?.value}</span>
                  )}
                </td>
                <td
                  className={`p-2 border-2 border-gray-400 ${
                    index % 2 === 0 ? "" : "bg-gray-100"
                  } m-auto`}
                >
                  {item?.posts?.length}
                </td>
                <td
                  className={`p-2 border-2 border-gray-400 ${
                    index % 2 === 0 ? "" : "bg-gray-100"
                  } m-auto`}
                >
                  {moment(item?.createdAt).format("DD/MM/yyyy")}
                </td>
                <td
                  className={`p-2 border-2 border-gray-400 ${
                    index % 2 === 0 ? "" : "bg-gray-100"
                  } m-auto`}
                >
                  <span
                    className="p-2 cursor-pointer text-blue-500 font-medium hover:underline"
                    onClick={() => handleUpdate(item)}
                  >
                    Sửa
                  </span>
                  <span
                    className="p-2 cursor-pointer text-red-500 font-medium hover:underline"
                    onClick={() => {
                      Swal.fire({
                        title: "Bạn chắc chắn muốn xóa?",
                        text: "Bạn không thể khôi phục lại dữ liệu này!",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#3085d6",
                        cancelButtonColor: "#d33",
                        confirmButtonText: "Yes, delete it!",
                      }).then((result) => {
                        if (result.isConfirmed) {
                          deletePost(item.id);
                        }
                      });
                    }}
                  >
                    Xóa
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users && (
        <div className="">
          <Pagination admin count={users?.count} posts={users?.rows} />
        </div>
      )}
    </div>
  );
};

export default ManageUser;
