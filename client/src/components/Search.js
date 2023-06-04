import React, { useState } from 'react'

const Search = ({ handleSeach, type, fetch }) => {
    const [q, setQ] = useState('')
    const seach = () => {
        if (type === 'user') {

        }
    }
    return (
        <div className='mt-4 w-full flex items-center justify-end gap-4'>
            <input
                type="text"
                className='p-2 border rounded-md w-[500px] outline-none'
                placeholder='Tìm theo tên/email/....'
                value={q}
                onChange={e => setQ(e.target.value)}

            />
            <button
                type='button'
                className='px-4 py-2 border border-blue-500'
                onClick={seach}
            >
                Tìm
            </button>
        </div>
    )
}

export default Search