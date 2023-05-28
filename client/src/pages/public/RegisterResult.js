import React from 'react'
import { useParams, Link } from 'react-router-dom'
import path from '../../ultils/path'

const RegisterResult = () => {
    const { status } = useParams()
    return (
        <div className='py-8 min-h-screen flex flex-col justify-center items-center gap-4'>
            <div className='p-8 border rounded-md'>
                <img src='https://cdn2.cellphones.com.vn/213x213,webp,q100/media/wysiwyg/Shipper_CPS.jpg' alt="" className='w-[300px] object-contain' />
                <span className='flex items-center gap-3'>
                    <span>{+status === 1 ? 'Đăng ký tài khoản thành công' : 'Đăng ký tài khoản không thành công.'}</span>
                    <Link
                        to={`/${path.LOGIN}`}
                        state={{ register: +status === 1 ? false : true }}
                        className='text-blue-500 hover:underline'
                    >
                        {+status === 1 ? 'Đi tới đăng nhập' : 'Đăng ký lại'}
                    </Link>
                </span>
            </div>
        </div>
    )
}

export default RegisterResult