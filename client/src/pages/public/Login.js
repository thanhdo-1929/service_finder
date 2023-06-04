import React, { useState, useEffect } from "react";
import { InputForm, Button } from "../../components";
import { useLocation, useNavigate, Link } from "react-router-dom";
import * as actions from "../../store/actions";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import validate from "../../ultils/fn";
import { apiForgotPassword } from "../../apis";

const Login = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoggedIn, mes, update } = useSelector((state) => state.auth);
  const [isRegister, setIsRegister] = useState(location.state?.flag);
  const [invalidFields, setInvalidFields] = useState([]);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [invalidEmail, setInvalidEmail] = useState(null);
  // const [isLoading, setIsLoading] = useState(false)
  const [payload, setPayload] = useState({
    email: "",
    password: "",
    name: "",
  });
  useEffect(() => {
    setIsRegister(location.state?.flag);
  }, [location.state?.flag]);

  useEffect(() => {
    // setIsLoading(false)
    isLoggedIn && navigate("/");
  }, [isLoggedIn]);
  // useEffect(() => {

  //     return () => {

  //     }
  // }, [])
  useEffect(() => {
    // setIsLoading(false)
    mes && Swal.fire("Oops !", mes, "info");
  }, [update]);
  const handleSubmit = async () => {
    // setIsLoading(true)
    let finalPayload = isRegister
      ? payload
      : {
          email: payload.email,
          password: payload.password,
        };
    let invalids = validate(finalPayload, setInvalidFields);
    if (invalids === 0 && isRegister) dispatch(actions.register(payload));
    if (invalids === 0 && !isRegister) dispatch(actions.login(payload));
  };
  const handleForgotPassword = async () => {
    if (!email) setInvalidEmail("Vui lòng hãy điền email.");
    const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!email.match(regex)) setInvalidEmail("Email không hợp lệ.");
    else {
      const response = await apiForgotPassword({ email });
      Swal.fire("Almost...", response.mes, "info").then(() => {
        setIsForgot(false);
      });
    }
  };

  return (
    <div className="w-full flex items-center relative justify-center">
      {isForgot && (
        <div
          onClick={() => setIsForgot(false)}
          className="fixed top-0 right-0 left-0 z-50 bottom-0 bg-overlay-70 flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[600px] bg-white rounded-md p-4 flex flex-col gap-2"
          >
            <span className="font-semibold">Nhập email của bạn:</span>
            <div className="w-full flex flex-col">
              <input
                type="text"
                className="p-2 border rounded-md outline-none placeholder:text-sm placeholder:italic"
                placeholder="Nhập email để có thể xác thực đổi mật khẩu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setInvalidEmail(null)}
              />
              {invalidEmail && (
                <small className="text-red-500 italic">{invalidEmail}</small>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="w-fit px-4 py-2 text-white font-bold bg-blue-500 rounded-md"
                onClick={handleForgotPassword}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      {/* {isLoading && <div className='fixed top-0 right-0 left-0 bottom-0 bg-overlay-70 flex items-center justify-center'>
                <Loading />
            </div>} */}
      <div className="absolute top-0 left-0 right-0 bottom-0 z-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
        <div className="bg-white w-[600px] p-[30px] rounded-md shadow-lg border">
          <h3 className="font-semibold text-2xl mb-3">
            {isRegister ? "Đăng kí tài khoản" : "Đăng nhập"}
          </h3>
          <div className="w-full flex flex-col gap-5">
            {isRegister && (
              <InputForm
                setInvalidFields={setInvalidFields}
                invalidFields={invalidFields}
                label={"HỌ TÊN"}
                value={payload.name}
                setValue={setPayload}
                keyPayload={"name"}
              />
            )}
            <InputForm
              setInvalidFields={setInvalidFields}
              invalidFields={invalidFields}
              label={"EMAIL"}
              value={payload.email}
              setValue={setPayload}
              keyPayload={"email"}
            />
            <InputForm
              setInvalidFields={setInvalidFields}
              invalidFields={invalidFields}
              label={"MẬT KHÂU"}
              value={payload.password}
              setValue={setPayload}
              keyPayload={"password"}
              type="password"
            />
            <Button
              text={isRegister ? "Đăng kí" : "Đăng nhập"}
              bgColor="bg-secondary1"
              textColor="text-white"
              fullWidth
              onClick={handleSubmit}
            />
          </div>
          <div className="mt-7 flex items-center justify-between">
            {isRegister ? (
              <small>
                Bạn đã có tài khoản?{" "}
                <span
                  onClick={() => {
                    setIsRegister(false);
                    setPayload({
                      email: "",
                      password: "",
                      name: "",
                    });
                  }}
                  className="text-blue-500 hover:underline cursor-pointer"
                >
                  Đăng nhập ngay
                </span>
              </small>
            ) : (
              <>
                <small
                  onClick={() => setIsForgot(true)}
                  className="text-[blue] hover:underline cursor-pointer"
                >
                  Bạn quên mật khẩu
                </small>
                <small
                  onClick={() => {
                    setIsRegister(true);
                    setPayload({
                      email: "",
                      password: "",
                      name: "",
                    });
                  }}
                  className="text-[blue] hover:underline cursor-pointer"
                >
                  Tạo tài khoản mới
                </small>
              </>
            )}
          </div>
          <div className="flex items-center justify-center mt-8">
            <Link to="/" className="text-blue-500 hover:underline text-sm">
              Bỏ quan đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
