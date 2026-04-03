import React from 'react'

function App() {
  return (
    // This is our main split-screen container
    <div className="flex flex-col md:flex-row h-screen w-full">
      
      {/* Left Side: Brand Section (Deep Navy) */}
      <div className="flex-1 bg-[#1A1F2B] flex items-center justify-center p-8">
         {/* We will put the BrandSection component here */}
         <p className="text-white">Brand Section Placeholder</p>
      </div>

      {/* Right Side: Auth Section (White/Light) */}
      <div className="flex-1 bg-white flex items-center justify-center p-8">
         {/* We will put the AuthSection component here */}
         <p className="text-black">Auth Section Placeholder</p>
      </div>

    </div>
  )
}

export default App