import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/useAuth.js';

function LayoutPrivado({ children }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return (
      <div className="min-h-screen bg-[#F5ECD7]">
        <Navbar />
        <div>{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5ECD7]">
      <Sidebar />
      <div className="ml-16 flex-1">
        {children}
      </div>
    </div>
  );
}

export default LayoutPrivado;
