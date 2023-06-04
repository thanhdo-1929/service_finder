import React, { memo, useState, useEffect, useRef } from 'react';
import { InputField, Map } from '../../components';
import {
  apiGetProvinces,
  apiGetDistrict,
  apiCreateNewPost,
  apiUpdatePost,
  apiUpdatePostByAdmin,
} from '../../apis';
import { Editor } from '@tinymce/tinymce-react';
import { useSelector, useDispatch } from 'react-redux';
import icons from '../../ultils/icons';
import {
  getBase64,
  getDistanceFromLatLonInKm,
  validate,
} from '../../ultils/fn';
import actionTypes from '../../store/actions/actionTypes';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import Geocode from 'react-geocode';
import { attention } from '../../ultils/constants';
import { useDebounce } from '../../hooks/useDebounce';
Geocode.setApiKey(process.env.REACT_APP_GOOGLE_KEY);
Geocode.setLanguage('vi');

const { AiFillCamera } = icons;

const CreatePost = ({ setEdit, updatingPost, isAdmin }) => {
  const dispatch = useDispatch();
  const [cate, setCate] = useState(false);
  const { currentData } = useSelector((state) => state.user);
  const [payload, setPayload] = useState({
    title: '',
    price: '',
    address: '',
    category: '',
    distance: '',
    area: '',
    desc: '',
    receiverName: '',
    receiverPhone: currentData.phone || '',
    ref: '',
    foodType: '',
  });
  const location = useLocation();
  const editorRef = useRef(null);
  const [invalidFields, setInvalidFields] = useState([]);
  const { categories, foodtypes } = useSelector((state) => state.app);

  const [coords, setCoords] = useState({});
  const [images, setImages] = useState('');
  const [rawImages, setRawImages] = useState(null);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(function (position) {
      setCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  }, []);
  useEffect(() => {
    setPayload((prev) => ({
      ...prev,
      category: location.state?.category || '',
    }));
  }, [location]);
  useEffect(() => {
    if (updatingPost) {
      setPayload({
        title: updatingPost?.title || '',
        price: updatingPost?.price || '',
        address: updatingPost?.address || '',
        category: updatingPost?.category || '',
        distance: updatingPost?.distance || '',
        area: updatingPost?.area || '',
        desc: updatingPost?.desc || '',
        receiverName: updatingPost?.receiverName || '',
        receiverPhone: updatingPost?.receiverPhone || currentData?.phone || '',
        ref: updatingPost?.ref || '',
        foodType: updatingPost?.foodType || '',
      });
      setImages(updatingPost?.images);
    }
  }, [updatingPost]);

  const checkFiles = (files) => {
    let invalidFile = 0;
    for (let file of files) {
      if (!file.type.includes('image')) invalidFile++;
    }
    return invalidFile;
  };

  const handleMutilImages = async (e) => {
    if (checkFiles(e.target.files) === 0) {
      setRawImages(e.target.files);
      const images = [];
      for (let file of e.target.files) {
        const base64 = await getBase64(file);
        images.push(base64);
      }
      setImages(images);
    } else
      toast.info(
        'Có file không phải ảnh trong số các file bạn upload lên. Hãy tải lại ảnh'
      );
  };
  const handleSubmit = async () => {
    if (rawImages && rawImages.length > 10) {
      toast.error('Only 10 images');
    } else {
      payload.desc = editorRef.current?.getContent();
      const formData = new FormData();
      for (let el of Object.entries(payload)) formData.append([el[0]], el[1]);
      if (rawImages) {
        for (let image of rawImages) formData.append('images', image);
      } else {
        for (let image of images) formData.append('imageLink', image);
      }
      const validateFields = {
        title: payload.title,
        category: payload.category,
        distance: payload.distance,
        desc: payload.desc,
        ref: payload.ref,
        receiverPhone: payload.receiverPhone,
        address: payload.address,
      };
      if (payload.category === 'TNT') {
        validateFields.price = payload.price;
        validateFields.area = payload.area;
      }
      if (payload.category === 'TQA')
        validateFields.foodType = payload.foodType;
      const invalids = validate(validateFields, setInvalidFields);
      if (updatingPost && invalids === 0) {
        if (location.pathname.includes('admin'))
          formData.append('isAdmin', true);
        dispatch({ type: actionTypes.LOADING, flag: true });
        const response = !location.pathname.includes('admin')
          ? await apiUpdatePost(updatingPost.id, formData)
          : await apiUpdatePostByAdmin(updatingPost.id, formData);
        dispatch({ type: actionTypes.LOADING, flag: false });
        if (response.success) {
          toast.success('Cập nhật bài đăng thành công~');
          setEdit(null);
        } else toast.error('Something went wrong');
      } else {
        if (rawImages && invalids === 0) {
          dispatch({ type: actionTypes.LOADING, flag: true });
          const response = await apiCreateNewPost(formData);
          dispatch({ type: actionTypes.LOADING, flag: false });
          setInvalidFields([]);
          if (response.success) {
            toast.success('Tạo bài đăng thành công~');
            setPayload({
              title: '',
              price: '',
              address: '',
              category: '',
              distance: '',
              area: '',
              desc: '',
              receiverName: '',
              receiverPhone: '',
              ref: '',
              foodType: '',
            });
            setImages(null);
          } else toast.error(response.mes);
        } else {
          toast.info(
            'Hãy điền đầy đủ thông tin ( có thể bạn đang thiếu ảnh cho bài đăng này)'
          );
        }
      }
    }
  };
  const handleGetDistance = async () => {
    let lat1;
    let lat2;
    let lng1;
    let lng2;
    if (payload && payload.address) {
      const response = await Geocode.fromAddress(payload.address);
      if (response) {
        const rsfrom = response.results[0].geometry.location;
        lat1 = rsfrom.lat;
        lng1 = rsfrom.lng;
      }
    }
    if (payload && payload.ref) {
      const rs = await Geocode.fromAddress(payload.ref);
      if (rs) {
        const rsfrom = rs.results[0].geometry.location;
        lat2 = rsfrom.lat;
        lng2 = rsfrom.lng;
      }
    }
    if (lat1 && lng1 && lat2 && lng2) {
      const dist = getDistanceFromLatLonInKm(lat1, lng1, lat2, lng2);
      setPayload((prev) => ({ ...prev, distance: dist || 0 }));
    }
  };

  const getLatLng = async (addr) => {
    console.log(addr);
    const response = await Geocode.fromAddress(addr);
    console.log(response);
    if (response) {
      const { lat, lng } = response.results[0].geometry.location;
      setCoords({ lat, lng });
    }
  };
  const addr = useDebounce(payload.address, 500);
  useEffect(() => {
    getLatLng(addr);
  }, [addr]);
  return (
    <div className='flex flex-col items-center pb-[100px] p-4 bg-white'>
      <div className='flex w-full items-center justify-between border-b border-gray-200'>
        <h3 className='font-bold text-[30px] pb-4 '>
          {!updatingPost ? 'Tạo mới tin đăng' : 'Chỉnh sửa tin đăng'}
        </h3>
      </div>
      <div className='py-8 flex gap-4 w-full'>
        <div className='flex flex-col gap-4 flex-auto w-full'>
          <div className='flex gap-4 w-full'>
            <div className='flex-3'>
              <InputField
                preValue={'Tiêu đề: '}
                value={payload.title}
                nameKey='title'
                setValue={setPayload}
                setInvalidFields={setInvalidFields}
                invalidFields={invalidFields}
              />
            </div>
            {location.state?.category ? (
              <div className='flex-1'>
                <InputField
                  preValue={'Danh mục: '}
                  value={
                    categories?.find(
                      (el) => el.code === location.state?.category
                    )?.value || ''
                  }
                  onlyRead
                />
              </div>
            ) : (
              <div className='relative flex-1 '>
                <select
                  className='flex-1 outline-none bg-gray-100 rounded-l-full h-[56px] w-full rounded-r-full py-4 px-8 '
                  value={payload.category}
                  onChange={(e) => {
                    setPayload((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }));
                    if (e.target.value === 'TNT') setCate(true);
                    else setCate(false);
                  }}
                  onFocus={() => setInvalidFields && setInvalidFields([])}
                >
                  <option value=''>--Danh mục--</option>
                  {categories?.map((el) => (
                    <option key={el.code} value={el.code}>
                      {el.value}
                    </option>
                  ))}
                </select>
                {invalidFields?.some((i) => i.name === 'category') && (
                  <div className='text-red-500 text-xs italic pl-4'>
                    {invalidFields.find((i) => i.name === 'category')?.message}
                  </div>
                )}
              </div>
            )}
            {(location.state?.category === 'TQA' ||
              payload.category === 'TQA') && (
              <div className='relative flex flex-1 flex-col'>
                <select
                  className=' flex-auto bg-gray-100 rounded-l-full w-full outline-none rounded-r-full py-4 h-[56px] px-8'
                  value={payload.foodType}
                  onChange={(e) =>
                    setPayload((prev) => ({
                      ...prev,
                      foodType: e.target.value,
                    }))
                  }
                  onFocus={() => setInvalidFields && setInvalidFields([])}
                >
                  <option value=''>--Loại quán ăn--</option>
                  {foodtypes?.map((el) => (
                    <option key={el.code} value={el.code}>
                      {el.value}
                    </option>
                  ))}
                </select>
                {invalidFields?.some((i) => i.name === 'foodType') && (
                  <small className='text-red-500 text-xs italic pl-4'>
                    {invalidFields.find((i) => i.name === 'foodType')?.message}
                  </small>
                )}
              </div>
            )}
          </div>
          {location.state &&
            location.state.category &&
            location.state.category === 'TNT' && (
              <div className='flex gap-4'>
                <InputField
                  preValue={'Giá thuê (vnđ): '}
                  value={payload.price}
                  nameKey='price'
                  setValue={setPayload}
                  setInvalidFields={setInvalidFields}
                  invalidFields={invalidFields}
                />
                <InputField
                  preValue={'Diện tích (m2): '}
                  value={payload.area}
                  nameKey='area'
                  setValue={setPayload}
                  setInvalidFields={setInvalidFields}
                  invalidFields={invalidFields}
                />
              </div>
            )}
          {updatingPost && updatingPost.category === 'TNT' && (
            <div className='flex gap-4'>
              <InputField
                preValue={'Giá thuê (vnđ): '}
                value={payload.price}
                nameKey='price'
                setValue={setPayload}
                setInvalidFields={setInvalidFields}
                invalidFields={invalidFields}
              />
              <InputField
                preValue={'Diện tích (m2): '}
                value={payload.area}
                nameKey='area'
                setValue={setPayload}
                setInvalidFields={setInvalidFields}
                invalidFields={invalidFields}
              />
            </div>
          )}
          {cate && (
            <div className='flex gap-4'>
              <InputField
                preValue={'Giá thuê (vnđ): '}
                value={payload.price}
                nameKey='price'
                setValue={setPayload}
                setInvalidFields={setInvalidFields}
                invalidFields={invalidFields}
              />
              <InputField
                preValue={'Diện tích (m2): '}
                value={payload.area}
                nameKey='area'
                setValue={setPayload}
                setInvalidFields={setInvalidFields}
                invalidFields={invalidFields}
              />
            </div>
          )}
          <div className='flex gap-4'>
            <InputField
              preValue={'Người đăng: '}
              value={currentData.name}
              nameKey='receiverName'
              onlyRead={true}
              setInvalidFields={setInvalidFields}
              invalidFields={invalidFields}
            />
            <InputField
              preValue={'Số điện thoại: '}
              value={payload.receiverPhone}
              nameKey='receiverPhone'
              setValue={setPayload}
              setInvalidFields={setInvalidFields}
              invalidFields={invalidFields}
            />
          </div>
          <div className=''>
            <InputField
              preValue={'Địa chỉ: '}
              value={payload.address}
              setValue={setPayload}
              nameKey={'address'}
              setInvalidFields={setInvalidFields}
              invalidFields={invalidFields}
            />
          </div>
          <div className='flex gap-4'>
            <InputField
              preValue={'Tính từ nơi: '}
              value={payload.ref}
              nameKey='ref'
              setValue={setPayload}
              setInvalidFields={setInvalidFields}
              invalidFields={invalidFields}
            />
            <button
              type='button'
              className='w-fit flex-none border border-blue-500 h-[56px] text-blue-500 font-bold rounded-md px-4 py-2'
              onClick={handleGetDistance}
            >
              Tính khoảng cách
            </button>
          </div>
          <InputField
            preValue={'Khoảng cách (m): '}
            value={payload.distance}
            nameKey='distance'
            setValue={setPayload}
            setInvalidFields={setInvalidFields}
            invalidFields={invalidFields}
          />
          <div className='flex flex-col gap-2 py-4'>
            <span className='font-bold'>Mô tả chi tiết:</span>
            <Editor
              apiKey='wmtf9tg6tu59bcfn55m6ytf62l61ckkerdn8per849gatpt4'
              onInit={(evt, editor) => (editorRef.current = editor)}
              initialValue={payload.desc}
              init={{
                height: 700,
                menubar: true,
                plugins: [
                  'advlist',
                  'autolink',
                  'lists',
                  'link',
                  'image',
                  'charmap',
                  'preview',
                  'anchor',
                  'searchreplace',
                  'visualblocks',
                  'code',
                  'fullscreen',
                  'insertdatetime',
                  'media',
                  'table',
                  'code',
                  'help',
                  'wordcount',
                ],
                toolbar:
                  'undo redo | blocks | ' +
                  'bold italic forecolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent | ' +
                  'removeformat | help',
                content_style:
                  'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
              }}
            />
            {invalidFields?.some((i) => i.name === 'desc') && (
              <small className='text-red-500 italic pl-4'>
                {invalidFields.find((i) => i.name === 'desc')?.message}
              </small>
            )}
          </div>
          <div className='flex flex-col gap-2 py-4'>
            <span className='font-bold'>Các hình ảnh bài đăng:</span>
            <label
              className='w-full border-2 h-[200px] gap-4 flex flex-col items-center justify-center border-gray-400 border-dashed rounded-md bg-gray-100'
              htmlFor='images'
            >
              <AiFillCamera size={60} color='gray' />
              <span className='text-gray-500 italic text-xs'>
                Chỉ hỗ trợ cái file ảnh có đuôi mở rộng .JPG và .PNG
              </span>
              <span className='text-gray-500 italic text-xs'>
                Chọn tối đa 10 ảnh
              </span>
            </label>
            {images && (
              <div className='flex flex-wrap'>
                {typeof images === 'string' ? (
                  <div className='w-1/4'>
                    <img
                      src={images}
                      alt='preview'
                      className='h-[207px] object-contain'
                    />
                  </div>
                ) : (
                  images?.map((el) => (
                    <div key={el} className='w-1/4'>
                      <img
                        src={el}
                        alt='preview'
                        className='h-[207px] object-contain'
                      />
                    </div>
                  ))
                )}
              </div>
            )}
            <input
              type='file'
              id='images'
              hidden
              multiple
              onChange={handleMutilImages}
            />
          </div>
        </div>
        <div className='flex-auto w-[30%] h-[300px]'>
          <Map
            googleMapURL={`https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=${process.env.REACT_APP_GOOGLE_KEY}`}
            loadingElement={<div style={{ height: `100%` }} />}
            containerElement={<div style={{ height: `100%` }} />}
            mapElement={<div style={{ height: `100%` }} />}
            coords={coords}
          />
          <div className='mt-8 bg-orange-100 text-orange-900 rounded-md p-4'>
            <h4 className='text-xl font-medium mb-4'>Lưu ý tin đăng</h4>
            <ul className='text-sm list-disc pl-6 text-justify'>
              {attention.map((item, index) => {
                return <li key={index}>{item}</li>;
              })}
            </ul>
          </div>
        </div>
      </div>
      <div className='flex justify-center items-center'>
        {updatingPost && (
          <button
            type='button'
            onClick={handleSubmit}
            className='py-2 px-4 bg-blue-600 rounded-md text-white font-semibold flex items-center justify-center gap-2'
          >
            <span>Xác nhận chỉnh sửa</span>
          </button>
        )}
        {!updatingPost && (
          <button
            type='button'
            onClick={handleSubmit}
            className='py-2 px-4 bg-blue-600 rounded-md text-white font-semibold flex items-center justify-center gap-2'
          >
            <span>Tạo bài đăng</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(CreatePost);
