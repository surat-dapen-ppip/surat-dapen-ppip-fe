"use client"
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    return (
        <div className="flex h-screen">
            {/* Left section for login */}


            <div className="w-1/2 flex flex-col justify-center items-center bg-white p-10">

                {/* Logo */}
                <div className="flex justify-center absolute top-10">
                    <img src="/logo-ppip.jpg" width='150px'></img>
                </div>

                {/* Sign In Form */}

                <div className="w-full max-w-xs">

                    <h2 className="text-2xl mb-1 text-gray-700 font-semibold text-center">Sign In</h2>
                    <h2 className="text-sm mb-6 text-gray-300 font-semibold text-center">Or create <span className="text-blue-400 ">an account</span></h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-600 font-semibold mb-1">Badge</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none text-gray-700 text-sm"
                            />
                        </div>
                        <div className="pb-5">
                            <div className="flex justify-between">
                                <label className="block text-xs text-gray-600 font-semibold mb-1">Password</label>
                                <a href="#" className="text-xs text-blue-400 font-semibold mt-1">Forgot Password?</a>
                            </div>
                            <input
                                type="password"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none text-gray-700 text-sm"
                            />
                        </div>

                        <button className="w-full bg-gray-700 text-white py-2 rounded-lg font-bold"
                            onClick={()=>{router.push("/admin")}}
                        >Sign In</button>
                    </div>
                </div>
            </div>

            {/* Right section for illustration */}
            <div className="w-1/2 bg-blue-50 flex items-center justify-center">
            </div>
        </div>
    )
}
