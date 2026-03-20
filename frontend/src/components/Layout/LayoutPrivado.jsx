import Sidebar from './Sidebar';

function LayoutPrivado({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F5ECD7]">
      <Sidebar />
      <div className="ml-16 flex-1">
        {children}
      </div>
    </div>
  )
}

export default LayoutPrivado;
