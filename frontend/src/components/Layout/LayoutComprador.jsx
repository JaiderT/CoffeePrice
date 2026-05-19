import Sidebar from './Sidebar';

function LayoutComprador({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F5ECD7]">
      <Sidebar />
      <div className="flex-1 pb-20 md:ml-16 md:pb-0">
        {children}
      </div>
    </div>
  )
}

export default LayoutComprador;
