import Sidebar from './Sidebar';
import Kaffi from '../kaffi';

function LayoutComprador({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F5ECD7]">
      <Sidebar />
      <div className="ml-16 flex-1">
        {children}
      </div>
      <Kaffi />
    </div>
  )
}

export default LayoutComprador;
