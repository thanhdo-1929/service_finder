import React, { useState, useEffect } from 'react'
import { apiUpdateProfile } from '../../apis/user'
import { InputField } from '../../components'
import moment from 'moment'
import 'moment/locale/vi'
import anon from '../../assets/anon-avatar.png'
import { getBase64 } from '../../ultils/fn'
import { useSelector, useDispatch } from 'react-redux'
import { getCurrent } from '../../store/actions'
import actionTypes from '../../store/actions/actionTypes'
import { toast } from 'react-toastify'
import { validate } from '../../ultils/fn'

const Personal = () => {
    const dispatch = useDispatch()
    const [payload, setPayload] = useState({
        name: '',
        email: '',
        role: '',
        image: '',
        createdAt: '',
        phone: '',
        postCount: 0,
    })
    const { currentData } = useSelector(state => state.user)
    const [isUpload, setIsUpload] = useState(false)
    const [image, setImage] = useState('')
    const [uid, setUid] = useState(null)
    const [update, setUpdate] = useState(false)
    const [invalidFields, setInvalidFields] = useState([])
    useEffect(() => {
        dispatch(getCurrent())
        setIsUpload(false)
        setImage(null)
    }, [update])
    useEffect(() => {
        if (currentData) {
            setPayload({
                name: currentData.name || '',
                email: currentData.email || '',
                role: currentData.roleData?.value || '',
                createdAt: currentData.createdAt || '',
                phone: currentData.phone || '',
                postCount: currentData?.posts?.length || 0,
            })
            setImage(currentData.image)
            setUid(currentData.id)
        }
    }, [currentData])
    const handleUpdate = async () => {
        const formData = new FormData()
        formData.append('name', payload.name)
        formData.append('email', payload.email)
        formData.append('phone', payload.phone)
        if (isUpload) formData.append('image', payload.image)
        const invalids = validate({ email: payload.email, name: payload.name, phone: payload.phone }, setInvalidFields)
        if (invalids === 0) {
            dispatch({ type: actionTypes.LOADING, flag: true })
            const response = await apiUpdateProfile(uid, formData)
            dispatch({ type: actionTypes.LOADING, flag: false })
            if (response.success) {
                setUpdate(!update)
                toast.success(response.user)
            }
            else toast.error(response.user)
        }
    }
    const handleUploadFile = async (e) => {
        if (e.target.files[0].type.includes('image')) {
            setPayload(prev => ({ ...prev, image: e.target.files[0] }))
            const base64 = await getBase64(e.target.files[0])
            setImage(base64)
            setIsUpload(true)
        } else toast.info('File upload không phải dạng ảnh. Hãy chọn file khác')
    }
    return (
        <div className='relative h-full bg-white p-4'>
            <div className='flex items-center gap-8 border-b'>
                <h3 className='font-bold text-[30px] pb-4 '>Thông tin cá nhân</h3>
            </div>
            <div className='flex gap-4 py-4 w-full'>
                <div className='flex flex-col gap-4 flex-auto'>
                    <InputField
                        preValue={'Email: '}
                        value={payload.email}
                        nameKey='email'
                        onlyRead={true}
                        invalidFields={invalidFields}
                        setInvalidFields={setInvalidFields}
                    />
                    <InputField
                        preValue={'Tên thành viên: '}
                        value={payload.name}
                        nameKey='name'
                        setValue={setPayload}
                        invalidFields={invalidFields}
                        setInvalidFields={setInvalidFields}
                    /> <InputField
                        preValue={'Số điện thoại: '}
                        value={payload.phone}
                        nameKey='phone'
                        setValue={setPayload}
                        invalidFields={invalidFields}
                        setInvalidFields={setInvalidFields}
                    />
                    <InputField
                        preValue={'Vai trò hiện tại: '}
                        value={payload.role}
                        onlyRead
                    />
                    <InputField
                        preValue={'Số bài đã đăng: '}
                        value={payload.postCount}
                        onlyRead
                    />
                    <InputField
                        preValue={'Ngày tạo tài khoản: '}
                        value={`${moment(payload.createdAt).format('DD/MM/YYYY')} (${moment(payload.createdAt).fromNow()})`}
                        onlyRead
                    />
                </div>
                <div className='flex-none w-[250px] flex gap-2 flex-col'>
                    <input value={''} onChange={handleUploadFile} type="file" id="avatar" hidden />
                    <label className='flex flex-col items-center' htmlFor="avatar">
                        <img src={image || anon} className='w-[250px] h-[250px] object-cover rounded-full' alt="avatar" />
                        <span className='italic text-xs'>{`(bấm vào ảnh để đổi avatar)`}</span>
                    </label>
                </div>
            </div>
            <button
                type='button'
                className='py-2 px-4 text-white font-bold bg-blue-500 rounded-md'
                onClick={handleUpdate}
            >
                Cập nhật
            </button>
        </div>
    )
}

export default Personal